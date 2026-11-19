#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YY ZONE 点播源库构建（第 49 轮）
================================
产物：yyzone-sources.json —— YY ZONE 客户端启动后自动拉取并热更新源表。

思路：资源站换域名比换站长还勤（量子 lziapi→lzizy1、非凡 ffzyapi→ffzy5）。
与其把域名写死在客户端，不如每天在 CI 里把「一族源」的所有已知域名打一遍，
谁活着就把谁的 api 写进源库；客户端只认稳定 id，域名变了也不影响本地启用
状态、观看记录、收藏。

数据来源：
  1. cms_families.json —— 人工维护的「源族」表：id / 名字 / 候选域名 / m3u8 线路名
  2. tv.json           —— 同仓库聚合出来的 TVBox 单仓，顺手把它里面 type=1 的
                          MacCMS 站点也探一遍，能用的作为新源补充进来

判定可用：HTTP 200 + JSON 可解析 + list 非空（`ac=list&pg=1`）。
`from/<line>/` 路径优先（只回 m3u8 一条线路，响应体小一半），不可用回退标准路径。
"""
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import concurrent.futures

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = "yyzone-sources.json"
FAMILIES = "cms_families.json"
TIMEOUT = 8
WORKERS = 12
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

# 不进源库的站：伦理/色情/赌博类，客户端口径是「只允许主动搜索时才出现」
BAD_WORD = re.compile(r"伦理|色情|成人|情色|里番|福利|博彩|赌")


def host_of(url):
    try:
        return urllib.parse.urlsplit(url).hostname or ""
    except Exception:
        return ""


def base_of(url):
    m = re.match(r"(https?://[^/]+)", url.strip())
    return m.group(1) if m else ""


def probe(api, params="ac=list&pg=1", timeout=TIMEOUT):
    """返回 (ok, ms, total, note)。total 是源站整库量（ac=list 的 total 字段）。"""
    url = api + ("&" if "?" in api else "?") + params
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as r:
            raw = r.read()
        ms = int((time.time() - t0) * 1000)
        txt = raw[:200].decode("utf-8", "ignore").lstrip()
        if txt.startswith("<") or not txt:
            return False, ms, 0, "XML/HTML（非 JSON 接口）"
        data = json.loads(raw.decode("utf-8", "ignore"))
        items = data.get("list") or []
        if not items:
            return False, ms, 0, "list 为空"
        total = int(data.get("total") or 0)
        return True, ms, total, ""
    except urllib.error.HTTPError as e:
        return False, int((time.time() - t0) * 1000), 0, "HTTP %s" % e.code
    except Exception as e:
        return False, int((time.time() - t0) * 1000), 0, str(e)[:60]


def candidates_for(family):
    """一族源要试的 api 列表：先 from 加速路径，再标准路径。"""
    line = (family.get("line") or "").strip()
    out = []
    for host in family.get("domains") or []:
        root = host if host.startswith("http") else "https://" + host
        root = root.rstrip("/")
        if line:
            out.append(("%s/api.php/provide/vod/from/%s/" % (root, line), "from"))
        out.append(("%s/api.php/provide/vod/" % root, "std"))
    return out


def eval_family(family):
    """按 domains 的书写顺序取第一个可用的（不按 ms 抢最快）。
    域名顺序是人工排的：首位是最可信的主域，后面才是备域/镜像。
    只有主域真死了才往后走 —— 这样源库里的 api 稳定，客户端不会因为一次网络
    抖动就把 api 改来改去，用户那边的启用状态和观看记录也不会错位。"""
    tried = []
    for api, kind in candidates_for(family):
        ok, ms, total, note = probe(api)
        tried.append({"api": api, "ok": ok, "ms": ms, "note": note})
        if ok:
            return family.get("id"), {"api": api, "kind": kind, "ms": ms, "total": total}, tried
    return family.get("id"), None, tried


def collect_tvbox_sites():
    """从 tv.json 抽 MacCMS 站点（type=1 且 api 是 vod 接口）。"""
    p = os.path.join(ROOT, "tv.json")
    if not os.path.exists(p):
        return []
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []
    out = []
    for s in data.get("sites") or []:
        if s.get("type") != 1:
            continue
        api = str(s.get("api") or "")
        if "api.php/provide/vod" not in api:
            continue
        name = str(s.get("name") or "")
        if BAD_WORD.search(name):
            continue
        out.append({"name": name, "api": api})
    return out


def hid_for(url, known_hosts):
    """新源生成稳定 id：命中已知族的域名就复用族 id。"""
    h = host_of(url)
    for fam in known_hosts:
        for d in fam.get("domains") or []:
            dh = host_of(d if "://" in d else "https://" + d)
            if dh and (h == dh or h.endswith("." + dh) or dh.endswith("." + h)):
                return fam["id"], fam
    norm = re.sub(r"^(www\.|api\.|caiji\.|cj\.|collect\.)", "", h)
    return "hub_" + re.sub(r"[^a-z0-9]+", "_", norm).strip("_"), None


def main():
    with open(os.path.join(ROOT, FAMILIES), "r", encoding="utf-8") as f:
        families = json.load(f)

    print("== 探测源族 %d 个 ==" % len(families))
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for fid, best, tried in ex.map(eval_family, families):
            fam = next((x for x in families if x["id"] == fid), {})
            results.append((fam, best, tried))
            flag = "OK  " if best else "DEAD"
            print("  %s %-18s %s%s" % (flag, fid, best["api"] if best else "", "  %dms" % best["ms"] if best else ""))

    sources = []
    unavailable = []
    for fam, best, tried in results:
        if not best:
            unavailable.append(fam["id"])
            continue
        sources.append({
            "id": fam["id"],
            "name": fam.get("name") or fam["id"],
            "api": best["api"],
            "tags": fam.get("tags") or [],
            "priority": fam.get("priority", 50),
            "searchable": fam.get("searchable", True),
            "ms": best["ms"],
            "total": best["total"],
            "path": best["kind"],
        })

    known_ids = {s["id"] for s in sources}
    extra = []
    for site in collect_tvbox_sites():
        sid, fam = hid_for(site["api"], families)
        if fam or sid in known_ids:
            continue
        extra.append((sid, site))

    if extra:
        print("== TVBox 新站 %d 个，逐个探 ==" % len(extra))
        uniq = {}
        for sid, site in extra:
            uniq.setdefault(sid, site)

        def probe_one(kv):
            sid, site = kv
            ok, ms, total, note = probe(site["api"])
            return sid, site, (ok, ms, total, note)

        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as ex:
            for sid, site, res in ex.map(probe_one, uniq.items()):
                ok, ms, total, note = res
                if not ok:
                    continue
                sources.append({
                    "id": sid,
                    "name": (site["name"] or sid)[:20],
                    "api": site["api"],
                    "tags": ["自动发现"],
                    "priority": 60,
                    "searchable": True,
                    "ms": ms,
                    "total": total,
                    "path": "std",
                })

    sources.sort(key=lambda s: (s["priority"], s["ms"]))
    payload = {
        "name": "YY ZONE 点播源库",
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(sources),
        "unavailable": unavailable,
        "sources": sources,
    }
    with open(os.path.join(ROOT, OUT), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print("== 写入 %s：%d 个可用源，%d 个族本次不可用 ==" % (OUT, len(sources), len(unavailable)))
    if unavailable:
        print("   不可用族（客户端保留本地原地址）：" + "、".join(unavailable))


if __name__ == "__main__":
    main()
