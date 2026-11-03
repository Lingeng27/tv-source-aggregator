#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TV 播放源聚合构建脚本（纯标准库，无第三方依赖）
================================================
产物：
  - aggregate.json : 多仓格式（推荐）。列出各优秀单仓源，播放器自行拉取，最稳。
  - tv.json        : 单仓合并格式（进阶）。把多个源的 sites 合并去重成一个文件。
  - live.m3u       : 直播源（自动更新）。镜像并校验上游 m3u，去重后输出。

由 GitHub Actions 每日定时重新运行并提交，实现「自动更新」。
本地也可直接 `python build.py` 预览效果。
"""
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse
import ssl


def idna_url(url):
    """把含中文/非 ASCII 的主机名转成 punycode，路径做百分号编码，避免 urllib 编码报错。"""
    parts = urllib.parse.urlsplit(url)
    host = parts.hostname or ""
    if any(ord(c) > 127 for c in host):
        try:
            host = host.encode("idna").decode("ascii")
        except Exception:
            pass
    netloc = host
    if parts.port:
        netloc += ":" + str(parts.port)
    path = urllib.parse.quote(parts.path) if parts.path else parts.path
    query = urllib.parse.quote(parts.query, safe="=&%") if parts.query else ""
    return urllib.parse.urlunsplit((parts.scheme, netloc, path, query, parts.fragment))

ROOT = os.path.dirname(os.path.abspath(__file__))
TIMEOUT = 25
UA = "Mozilla/5.0 (Linux; Android 9; TVBox) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# 关闭证书校验（部分国内源证书不规范，避免误判失败；仅用于抓取公开索引）
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def load_json(name):
    with open(os.path.join(ROOT, name), "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(name, obj):
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def write_text(name, text):
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
        f.write(text)


def fetch(url):
    """直连优先，raw.githubusercontent 失败则走 gh-proxy 兜底。返回 (文本, 实际url)。"""
    url = idna_url(url)
    candidates = [url]
    if "raw.githubusercontent.com" in url and not url.startswith("https://gh-proxy"):
        candidates.append("https://gh-proxy.com/" + url)
    last_err = None
    for u in candidates:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as r:
                return r.read().decode("utf-8", "ignore"), u
        except Exception as e:
            last_err = e
            continue
    raise last_err or RuntimeError("fetch failed: " + url)


def fetch_json(url):
    txt, _ = fetch(url)
    # 去除独立行的 // 注释（很多源配置文件顶部带说明注释）
    lines = [l for l in txt.splitlines() if not l.lstrip().startswith("//")]
    return json.loads("\n".join(lines))


def merge_list(a, b):
    seen = set()
    out = []
    for x in a + b:
        k = json.dumps(x, ensure_ascii=False, sort_keys=True)
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def collect_sites(url, depth=0, visited=None):
    """从一个地址提取 (sites字典, parses, rules, flags, spider, ua)。支持多仓递归一层。"""
    if visited is None:
        visited = set()
    if url in visited:
        return {}, [], {}, {}, "", ""
    visited.add(url)
    try:
        data = fetch_json(url)
    except Exception as e:
        print("  ! 拉取失败 %s : %s" % (url, e))
        return {}, [], {}, {}, "", ""
    sites = {s.get("key"): s for s in data.get("sites", []) if s.get("key")}
    parses = data.get("parses", []) or []
    rules = data.get("rules") if isinstance(data.get("rules"), dict) else {}
    flags = data.get("flags") if isinstance(data.get("flags"), dict) else {}
    spider = data.get("spider", "") or ""
    ua = data.get("ua", "") or ""
    if depth < 1 and data.get("urls"):
        for sub in data["urls"]:
            sub_url = sub.get("url")
            if not sub_url:
                continue
            s2, p2, r2, f2, sp2, u2 = collect_sites(sub_url, depth + 1, visited)
            sites.update(s2)
            parses = merge_list(parses, p2)
            if isinstance(r2, dict):
                rules.update(r2)
            if isinstance(f2, dict):
                flags.update(f2)
            if not spider and sp2:
                spider = sp2
            if not ua and u2:
                ua = u2
    return sites, parses, rules, flags, spider, ua


def build_aggregate():
    sources = load_json("sources.json")
    urls = []
    seen = set()
    for s in sources:
        name = s.get("name")
        url = s.get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append({"name": name, "url": url})
    write_json("aggregate.json", {"urls": urls})
    print("[aggregate] 已写入 %d 条多仓源 -> aggregate.json" % len(urls))


def build_tv():
    sources = load_json("sources.json")
    all_sites = {}
    all_parses = []
    rules = {}
    flags = {}
    spider = ""
    ua = ""
    for s in sources:
        name = s.get("name")
        url = s.get("url")
        print("[tv] 处理 %s (%s)" % (name, url))
        sites, parses, r2, f2, sp2, u2 = collect_sites(url)
        all_sites.update(sites)
        all_parses = merge_list(all_parses, parses)
        if isinstance(r2, dict):
            rules.update(r2)
        if isinstance(f2, dict):
            flags.update(f2)
        if not spider and sp2:
            spider = sp2
        if not ua and u2:
            ua = u2
    if not all_sites:
        if os.path.exists(os.path.join(ROOT, "tv.json")):
            print("[tv] 本次全部源拉取失败，保留上次缓存 tv.json")
            return
        print("[tv] 警告：未能抓到任何站点，生成空 tv.json")
    out = {
        "spider": spider,
        "sites": list(all_sites.values()),
        "parses": all_parses,
        "rules": rules,
        "flags": flags,
        "ua": ua,
        "lives": [],
    }
    write_json("tv.json", out)
    print("[tv] 合并 %d 个站点 -> tv.json" % len(all_sites))


def build_live():
    sources = load_json("live_sources.json")
    entries = {}  # url -> extinf(可能多行)
    order = []
    for url in sources:
        try:
            txt, _ = fetch(url)
        except Exception as e:
            print("  ! 直播源拉取失败 %s : %s" % (url, e))
            continue
        cur_inf = None
        for raw in txt.splitlines():
            line = raw.rstrip("\r\n")
            if line.startswith("#EXTM3U"):
                continue
            if line.strip() == "":
                continue
            if line.startswith("#EXTINF"):
                cur_inf = line
            elif line.startswith("#"):
                if cur_inf is not None:
                    cur_inf += "\n" + line
            else:
                u = line.strip()
                if u not in entries:
                    entries[u] = cur_inf or "#EXTINF:-1,tv"
                    order.append(u)
                cur_inf = None
    if not order:
        if os.path.exists(os.path.join(ROOT, "live.m3u")):
            print("[live] 本次全部源拉取失败，保留上次缓存 live.m3u")
            return
    out = ["#EXTM3U"]
    for u in order:
        for l in entries[u].split("\n"):
            out.append(l)
        out.append(u)
    write_text("live.m3u", "\n".join(out) + "\n")
    print("[live] 合并 %d 个频道 -> live.m3u" % len(order))


if __name__ == "__main__":
    print("==== 开始构建 TV 播放源聚合 ====")
    build_aggregate()
    build_tv()
    build_live()
    print("==== 完成 ====")
