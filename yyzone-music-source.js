/*!
 * @name YY Zone🎵音源
 * @description 五大平台(wy/tx/kw/kg/mg)聚合直链音源｜基于桌面《洛雪音乐-源》旧源包(41 个 js)逐个实测 + GitHub 上游最新版交叉比对后重建｜每条链路经真实取链 + HTTP Range 音频校验｜按音质能力分层 + 优先级并发 + 串行兜底｜链路健康度与实测延迟动态排序｜结果缓存｜音质自动降级｜kg/mg 支持按歌名跨平台兜底
 * @version 1.3.0
 * @author YY Zone
 * @license MIT
 * @update 2026-11-09
 * @changelog
 *   - 1.3.0 (2026-11-09) 整合 pdone 仓库 11-08 新发布的 4 个源（xinglan 星澜 v4.0.2 / qingliang 轻量音源 2.1.0 / suyin 溯音 / feichangdao 非常刀 v5）里实测可用的新端点，链路 31 条：
 *     · tx 新增「讯汇QQ」api.xunhuisi.store（实测两首 mid 全出完整曲，返回 .m4a，播放器内核解码 269.8s 正常）、「lzmhhhQQ」music.lzmhhh.com POST 表单
 *     · wy 新增「FFAPI网易」ffapi.cn（standard/exhigh/lossless 三档全通，lossless 是真 flac 27MB，内核解码 238.7s 正常）、「lzmhhh网易」、「bileizhen网易」（302 直跳音频流）
 *     · kw 新增「海棠w酷我」musicapi.haitangw.net（302 跳真实音频；免费曲完整 8.4MB mp3，VIP 曲仍是 22s 试听，已被试听识别拦下）
 *     · 新增 asStream 链路类型：build() 直接给可播地址（302 型接口），并用 Content-Range 总字节数 < 500KB 判定试听片段
 *     · 实测排除：api.chksz.top（域名不可达）、music.haitangw.cc/kgqq/kg.php（401 has not any level）、music.haitangw.cc/musicapi/mg.php（404）、m.kugou.com playInfo（url 为空，需带账号 cookie）、ncm.kangqiovo / api.yutangxiaowu / metings.qjqq（参数格式不符 400）
 *     · 汽水：feichangdao 的汽水入口（api.qishui.com/luna/h5/track + api-vehicle.volcengine.com 搜索）仍需汽水自有 track_id，且历史实测抖音/汽水链只有 60s 试听，本轮继续不接入
 *   - 1.2.1 (2026-11-09) 实测播放器内核：酷我 VIP/付费曲所有链路都只给 aac 22s 试听（duration=22, bitrate=48, format=aac），表现为"能出声但播一半就断"。现改为优先拿完整曲，仅当全部链路都只有试听时才兜底返回，并在 console 提示
 *   - 1.2.0 (2026-11-09) 修复「酷我在手机版播放器能取链但不出声」：
 *     · 根因1 —— 接口返回的酷我 CDN 直链是 http://（car-er / other-er），Android 播放器会拦明文请求；现已把所有 *.kuwo.cn 直链强制改写为 https（实测 http/https 均支持 206 audio/mpeg，改写无副作用）
 *     · 根因2 —— 可播放性预检把"拿不到 statusCode(code=0)"当成死链；手机版 request 对二进制流不回 statusCode，会被整条判死。现改为仅在明确 4xx/5xx 时判死
 *     · 酷我链路顺序回到 1010 v1.0.0 已验证可用的三条打头（nmobi → mobi → antiserver），新增的车机/fish/surl/HYW 退为补充
 *   - 1.1.0 (2026-11-07) 二轮复核：GitHub 上游最新版 20 个文件 + 汽水专线全部实测，结论并入下方注释；链路维持 25 条（本轮未发现可用新端点）
 *     · 汽水音乐：抖音官方 seo_track 免登录即可取到可播放流，但三档清晰度的 Duration 都是 60.001s（试听片段）；第三方汽水中转 api.vsaa.cn/api/music.qishui.vip 返回 404，api.qs.vip / api.qs.la 域名已消失；星海后端 source=qs 必须带汽水 songmid，取到的同样是 60s 抖音流 —— 故不接入汽水平台，避免"能播但只播 60 秒"
 *     · 六音 SixYin（pdone 仓库 v1.2.1）：与本地包同版本号，加载即自检失败（提示前往 sixyin.com），无可移植端点
 *     · 全豆要[聚合音源] v9.3：wy/kw/kg 320k 能出链，但独有端点已废 —— music.haitangw.cc/kgqq/kg.php 返回 {"code":201,"msg":"error"}、musicapi.haitangw.net 302、175.27.166.236 404、念心 music.nxinxz.com 404；其可用部分与本文件既有链路同源，故无新增
 *     · 上游最新版实测（320k）：HelloWorld v260925 5/5、裤佬 3.0.0 4/5、墨澜 2.3.5 3/5、杰翔 2.3.0 3/5、fish v1.9.0 5/5、Hei 2.2.1 0/5；出链主机仍是 星海 / HYW / cyapi / oiapi / 酷我车机，与既有链路同源，没有新端点
 *     · 星海 3.2.17 的通用后端（yy.zddyr.top/lx/api/?source=qq|migu）返回 403「仅对认证用户开放」，只有 kg 分支对外开放，本文件已在使用
 *     · 结论：本轮上游生态没有出现"新的、可移植的"取链入口；旧包与上游大范围停服，能稳定工作的仍是本文件这 25 条
 *   - 1.0.0 (2026-11-07) 整合《洛雪音乐-源》旧包与上游最新版，重建 25 条链路：wy 6 / tx 7 / kw 7 / kg 2 / mg 3
 *   - 旧包实测结论（26 个代表性源，逐条跑真实取链 + 音频字节探测）：
 *     · 长青SVIP v1.2.0（全平台无损）：解出的 haitangw / 175.27.166.236 五平台全灭；更新清单 13413.kstore.vip 返回 401 domain name is invalid
 *     · 聚合API v3.0.0(lerd.sukimon.me) / 聚合API v2.0.0(hhlqilongzhu.cn) / 音乐下载器 v4(api.v2.sukimon.me)：域名级死亡或证书过期
 *     · 六音 v1.0.7 / v1.1.0 / v1.2.0 / v1.2.1：加载即自检失败（作者已下线，指向 sixyin.com）
 *     · ikun v7 / v103 / v513：api.ikunshare.top 全平台 10s 超时；lxmusic.ikunshare.com、api.ikunshare.com 域名已消失
 *     · fish v1.0.1(本地) / 肥猫不肥 / monster v1.5.5 / 無名：HTTP 层可达但业务层拒绝（unknow error / failed），無名带防改名自检
 *     · 至尊源 v0.8.4(110.42.36.53:1314) / 梓澄二代(103.239.247.51:9763) / nya(103.40.13.21:9866)：超时或连接被拒
 *     · 晴天 v1.1.2 / FreeListen 1.1.2(原小熊猫)：走各平台官方接口，无用户 cookie 必然 Invalid cookie（属自定义账号源，不适合公共分发）
 *     · 野花 / 野草 / LX公众号 v3.0：混淆 + 宿主头校验（source-ver）或自检缺函数，无法在通用宿主外跑通
 *   - 旧包中唯一仍成体系的：Huibq —— 本地版指向 render.niuma666bet.buzz 已死，在线最新版(jsdelivr / keep-alive 仓库)指向 lxmusicapi.onrender.com + share-v3 仍可用，本文件沿用
 *   - 上游最新版实测：pdone/fish(latest) 五平台 320k 全通，但 wy/tx 走的是带账号 uin 的官方签名链、不可移植；可移植的部分是酷我车机 source=kwplayercar_ar_6.0.1.0_apk_keluze.apk，已作为 kw 新链路接入
 *   - 新增「酷我检索备用」跨平台兜底（kg/mg）：酷我搜索按歌名+歌手取 rid，再走车机接口取链；歌名必须精确相等且排除伴奏/cover/现场/串烧，否则直接放弃，宁可失败也不串歌
 *   - 新增：kg/mg 在缺少歌曲 ID 时，也能靠歌名走通兜底链路（旧版只能报"缺少歌曲 ID"）
 *   - 当日实测覆盖：wy 6/6、tx 7/7、kw 7/7、kg 2/2、mg 3/3 均可取到可播放直链
 *   - 已知波动：星海KG 的 128k 档偶发 HTTP 429（上游限流），此时由「酷我检索备用」兜底；星海KG 的 flac 档时快时慢（0.3~18s），已用前后预检超时兜住
 */

const { EVENT_NAMES, request, on, send } = globalThis.lx

// ==================== 可调参数 ====================
const CFG = {
  reqTimeout: 9000,       // 单条链路超时(ms)
  concurrent: 3,          // 首批并发链路数
  cacheTTL: 3 * 60 * 60 * 1000,  // 缓存有效期 3 小时
  cacheMax: 600,          // 缓存最大条目
  failThreshold: 3,       // 连续失败多少次后冷却
  cooldown: 10 * 60 * 1000,       // 冷却时间 10 分钟
  enablePrecheck: true,   // 取到直链后做可播放性校验
  precheckTimeout: 3500,  // 预检超时视为可用（不阻塞）
  enableFallback: true,   // 目标音质全部失败时，降级到相邻音质
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const TAG = '[YY Zone]'

// ==================== 平台与音质 ====================
const PLATFORM_NAMES = { wy: '网易云音乐', tx: 'QQ音乐', kw: '酷我音乐', kg: '酷狗音乐', mg: '咪咕音乐' }

const PLATFORM_QUALITY = {
  wy: ['flac', '320k', '192k', '128k'],
  tx: ['flac', '320k', '128k'],
  kw: ['flac', '320k', '192k', '128k'],
  kg: ['flac', '320k', '128k'],
  mg: ['320k', '128k'],
}

// 音质从高到低，用于降级
const Q_ORDER = ['flac24bit', 'flac', '320k', '192k', '128k']

// ==================== HTTP 层 ====================
function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method: opts.method || 'GET',
      timeout: opts.timeout || CFG.reqTimeout,
      headers: Object.assign({ 'User-Agent': UA }, opts.headers || {}),
    }
    if (opts.body) options.body = opts.body
    request(url, options, (err, res) => {
      if (err) return reject(new Error('请求失败:' + (err && err.message ? err.message : err)))
      const status = (res && res.statusCode) || 0
      if (status >= 400) return reject(new Error('HTTP ' + status))
      let body = res && res.body
      if (typeof body === 'string') {
        const t = body.trim()
        if (t.charAt(0) === '{' || t.charAt(0) === '[' || t.charAt(0) === '"') {
          try { body = JSON.parse(t) } catch (e) { /* 保持原始字符串 */ }
        }
      }
      resolve(body)
    })
  })
}

// ==================== 通用工具 ====================
const BAD_EXT = /\.(jpe?g|png|gif|webp|svg|ico|css|js|json|html?|txt|xml)(\?|$)/i

/** 从任意响应体中递归挑出第一个"像音频直链"的 URL */
function pickUrl(body, depth = 0) {
  if (!body || depth > 6) return null
  if (typeof body === 'string') {
    const t = body.trim()
    if (/^https?:\/\/\S+$/.test(t) && !BAD_EXT.test(t)) return t
    const m = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]{20,900}/.exec(t)
    if (m) {
      const u = m[0].replace(/["'\\)\]}>,]+$/g, '')
      if (!BAD_EXT.test(u)) return u
    }
    return null
  }
  if (Array.isArray(body)) {
    for (const v of body) { const r = pickUrl(v, depth + 1); if (r) return r }
    return null
  }
  if (typeof body === 'object') {
    const preferred = ['url', 'musicUrl', 'music_url', 'playUrl', 'play_url', 'link', 'song_url', 'mp3', 'src', 'audio', 'download', 'data']
    for (const k of preferred) if (body[k] != null) { const r = pickUrl(body[k], depth + 1); if (r) return r }
    for (const k of Object.keys(body)) {
      if (preferred.indexOf(k) >= 0) continue
      const r = pickUrl(body[k], depth + 1)
      if (r) return r
    }
  }
  return null
}

function isLikelyAudio(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) && url.length > 15 && !BAD_EXT.test(url)
}

/** 取字段：按候选名依次命中 */
function pickField(obj, names) {
  if (!obj) return ''
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]) !== '') return String(obj[n])
  }
  return ''
}

/** 各平台从 musicInfo 取歌曲 ID */
function getSongId(platform, mi) {
  if (!mi) return ''
  switch (platform) {
    case 'kg': return pickField(mi, ['hash', 'songmid', 'id', 'mhash'])
    case 'tx': return pickField(mi, ['songmid', 'mid', 'strMediaMid', 'id'])
    case 'kw': return pickField(mi, ['songmid', 'rid', 'id'])
    case 'mg': return pickField(mi, ['songmid', 'copyrightId', 'id'])
    default: return pickField(mi, ['songmid', 'id'])
  }
}

function getSongName(mi) { return pickField(mi, ['name', 'songName', 'title']) }
function getSinger(mi) {
  const s = pickField(mi, ['singer', 'artist', 'author'])
  if (s && s !== 'Unknown') return s
  const arr = mi && (mi.singers || mi.artists)
  if (Array.isArray(arr) && arr.length) {
    return arr.map(x => (typeof x === 'string' ? x : (x && (x.name || x.singer)) || '')).filter(Boolean).join('、')
  }
  return ''
}

/** 文本归一化：去掉空白、标点、HTML 实体，用于歌名/歌手比对 */
function normText(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\\u0026/gi, '&')
    .replace(/[\s、,，·.。&/\\'"~!?()（）【】\[\]—\-+]/g, '')
    .toLowerCase()
}

/** 歌手粗匹配：按歌名/歌手搜索的链路用它防串歌 */
function singerHit(a, b) {
  if (!a || !b) return true
  const A = normText(a), B = normText(b)
  if (!A || !B) return true
  return A.indexOf(B) >= 0 || B.indexOf(A) >= 0
}

/** 音质选择：请求音质不在平台音质表里时，向下取最接近档位 */
function selectQuality(requested, list) {
  const q = String(requested || '128k').toLowerCase()
  if (list.indexOf(q) >= 0) return q
  const idx = Q_ORDER.indexOf(q)
  if (idx >= 0) {
    for (let i = idx; i < Q_ORDER.length; i++) if (list.indexOf(Q_ORDER[i]) >= 0) return Q_ORDER[i]
  }
  return list[list.length - 1]
}

/** 降级音质列表：从当前档往下排 */
function degradeList(q, list) {
  const idx = Q_ORDER.indexOf(q)
  if (idx < 0) return []
  const out = []
  for (let i = idx + 1; i < Q_ORDER.length; i++) if (list.indexOf(Q_ORDER[i]) >= 0) out.push(Q_ORDER[i])
  return out
}

// ==================== 音质参数映射 ====================
const WY_BR = { flac24bit: '999000', flac: '999000', '320k': '320000', '192k': '192000', '128k': '128000' }
const GD_BR = { flac24bit: '999', flac: '999', '320k': '320', '192k': '192', '128k': '128' }
const KW_BR = { flac24bit: '4000kflac', flac: '2000kflac', '320k': '320kmp3', '192k': '192kmp3', '128k': '128kmp3' }
const TX_YF = { flac24bit: '母带', flac: 'SQ', '320k': 'HQ', '192k': 'HQ', '128k': '标准' }
// pdone 11-08 新源带来的端点音质映射
const FFAPI_Q = { flac24bit: 'lossless', flac: 'lossless', '320k': 'exhigh', '192k': 'exhigh', '128k': 'standard' }
const HW_KW_LV = { flac24bit: '2000', flac: '2000', '320k': '320', '192k': '320', '128k': '320' }

const enc = v => encodeURIComponent(String(v === undefined || v === null ? '' : v))

/** 各链路共享的请求头 */
const H_JSON = { Accept: 'application/json' }
const H_WY = { Referer: 'https://music.163.com/' }
const H_KW = { Referer: 'https://www.kuwo.cn/' }

// ==================== 酷我检索（跨平台兜底用） ==================== */
const KUWO_CAR_SRC = 'kwplayercar_ar_6.0.1.0_apk_keluze.apk'

/** 解析酷我搜索的伪 JSON（单引号 + &nbsp; 实体）：按 MUSICRID 定位，取窗口内 NAME / ARTIST */
function parseKuwoSearch(raw) {
  const out = []
  const re = /'MUSICRID'\s*:\s*'MUSIC_(\d+)'/g
  let m
  while ((m = re.exec(raw))) {
    const win = raw.slice(Math.max(0, m.index - 600), Math.min(raw.length, m.index + 900))
    const name = /'NAME'\s*:\s*'([^']*)'/.exec(win)
    const artist = /'ARTIST'\s*:\s*'([^']*)'/.exec(win)
    out.push({ rid: m[1], song: name ? name[1] : '', artist: artist ? artist[1] : '' })
  }
  return out
}

/** 严格挑歌：歌手必须命中、歌名必须精确相等、排除伴奏/翻唱/现场/串烧，否则返回 null（宁可失败不串歌） */
function pickKuwoExact(list, name, singer) {
  const want = normText(name)
  if (!want) return null
  const bad = /伴奏|纯音乐|铃声|cover|翻唱|现场|演唱会|live|remix|dj|吉他|ktv|原唱|版$/i
  let best = null
  for (const it of list) {
    if (!singerHit(it.artist, singer)) continue
    if (normText(it.song) !== want) continue
    if (bad.test(it.song) || /\+/.test(it.song)) continue
    if (!best) best = it
  }
  return best
}

// ==================== 链路定义 ====================
// 每条链路：
//   name     链路名（健康度以此为单位累计）
//   build    生成请求地址
//   opts     可选，{ method, headers, body }
//   headers  可选，附加请求头
//   parse    可选，自定义解析（可返回 Promise）
//   q        可选，支持音质白名单；缺省表示全音质可用
//   needName 可选，按歌名搜索的链路（需要歌名）
//   from     溯源：这条链路来自旧包哪个文件 / 哪个上游
const CHAIN = {
  wy: [
    {
      name: '网易官方',
      from: '旧包 晴天 / FreeListen 同款官方接口',
      build: c => `https://music.163.com/api/song/enhance/player/url?id=${enc(c.id)}&ids=%5B${enc(c.id)}%5D&br=${WY_BR[c.q] || '320000'}`,
      headers: H_WY,
    },
    {
      name: '溯音163',
      from: '旧包 溯音系 / 上游 922 接口',
      build: c => `https://oiapi.net/api/Music_163?id=${enc(c.id)}`,
    },
    {
      name: 'ikun网易',
      from: '旧包 ikun 系（ikunshare 域名已死，仅此中转 endpoint 存活）',
      q: ['flac24bit', 'flac', '320k', '128k'],
      build: () => 'https://c.wwwweb.top/music/url',
      opts: c => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': '' },
        body: JSON.stringify({ source: 'wy', musicId: c.id, quality: c.q }),
      }),
    },
    {
      name: '星海GD',
      from: '上游 星海 / GD Studio 公开接口',
      build: c => `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${enc(c.id)}&br=${GD_BR[c.q] || '320'}`,
    },
    {
      name: 'Huibq网易',
      from: '旧包 Huibq v1.2.0（本地域名已死，改用其在线最新版 onrender 入口）',
      // 192k 档实测会回落成酷我镜像链（有串歌风险），只挂 flac/320k/128k
      q: ['flac24bit', 'flac', '320k', '128k'],
      build: c => `https://lxmusicapi.onrender.com/url/wy/${enc(c.id)}/${enc(c.q)}`,
      headers: { 'X-Request-Key': 'share-v3' },
    },
    {
      name: 'HYW',
      from: '上游 HYW 公益版',
      // 只认 flac/320k/128k，192k 会 HTTP 400
      q: ['flac24bit', 'flac', '320k', '128k'],
      build: c => `http://103.79.184.97/api/music/url?source=wy&songId=${enc(c.id)}&quality=${c.q}&key=6C1F-53W0-GRKI-EVFG`,
    },
    {
      name: 'FFAPI网易',
      from: 'pdone 11-08 新增源 轻量音源 v2.1.0（qingliang）实测端点，flac 走 lossless 真无损',
      q: ['flac24bit', 'flac', '320k', '128k'],
      build: c => `https://ffapi.cn/int/v1/netease_url?id=${enc(c.id)}&quality=${FFAPI_Q[c.q] || 'exhigh'}`,
    },
    {
      name: 'lzmhhh网易',
      from: 'pdone 11-08 新增源 轻量音源 v2.1.0（qingliang），POST 表单，固定 320k',
      q: ['320k'],
      build: () => 'https://music.lzmhhh.com/api/music/url',
      opts: c => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://music.lzmhhh.com/' },
        body: `id=${enc(c.id)}&type=wy`,
      }),
    },
    {
      name: 'bileizhen网易',
      from: 'pdone 11-08 新增源 轻量音源 v2.1.0（qingliang），302 直跳音频流',
      asStream: true,
      q: ['320k'],
      build: c => `https://api.bileizhen.top/api/netease?id=${enc(c.id)}&level=exhigh`,
    },
  ],

  tx: [
    {
      name: 'Vkeys无损',
      from: '上游 Vkeys 公开接口',
      q: ['flac24bit', 'flac'],
      build: c => `https://api.vkeys.cn/music/tencent/song/link?mid=${enc(c.id)}`,
    },
    {
      name: 'Vkeys',
      from: '上游 Vkeys 公开接口',
      build: c => `https://api.vkeys.cn/v2/music/tencent/geturl?mid=${enc(c.id)}`,
    },
    {
      name: '收集聚合QQ',
      from: '上游 收集聚合 / cyapi',
      build: c => `https://cyapi.top/API/qq_music.php?apikey=1ffdf5733f5d538760e63d7e46ba17438d9f7b9dfc18c51be1109386fd74c3a1&type=json&mid=${enc(c.id)}`,
    },
    {
      name: 'YuafengQQ',
      from: '上游 Yuafeng 公开接口',
      build: c => `https://api-v2.yuafeng.cn/API/qqmusic.php?type=${enc(TX_YF[c.q] || 'HQ')}&mid=${enc(c.id)}&apikey=3ff23523e47465224a3f48579acf41f241540ce04b6cc0b94164f37a5b6299d5`,
    },
    {
      name: '流云BaiMusic',
      from: '上游 流云 BaiMusic',
      build: c => `https://api.liuyunidc.cn/baimusic/musicurl.php?source=tx&musicId=${enc(c.id)}&quality=${enc(c.q)}`,
    },
    {
      name: 'HYW',
      from: '上游 HYW 公益版',
      build: c => `http://103.79.184.97/api/music/url?source=tx&songId=${enc(c.id)}&quality=${c.q}&key=6C1F-53W0-GRKI-EVFG`,
    },
    {
      name: 'HuibqQQ',
      from: '旧包 Huibq v1.2.0（在线最新版入口）',
      build: c => `https://lxmusicapi.onrender.com/url/tx/${enc(c.id)}/${enc(c.q)}`,
      headers: { 'X-Request-Key': 'share-v3' },
    },
    {
      name: '讯汇QQ',
      from: 'pdone 11-08 新增源 轻量音源 v2.1.0（qingliang）实测最稳新端点，music_url 字段',
      build: c => `https://api.xunhuisi.store/API/QQMusic/Song.php?mid=${enc(c.id)}&type=json`,
    },
    {
      name: 'lzmhhhQQ',
      from: 'pdone 11-08 新增源 轻量音源 v2.1.0（qingliang），POST 表单，固定 320k',
      q: ['320k'],
      build: () => 'https://music.lzmhhh.com/api/music/url',
      opts: c => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://music.lzmhhh.com/' },
        body: `id=${enc(c.id)}&type=qq`,
      }),
    },
  ],

  kw: [
    {
      name: '酷我官方nmobi',
      from: '旧包 酷我 HD 客户端接口（1010 v1.0.0 实测可用，排首位保证手机版兼容）',
      build: c => `https://nmobi.kuwo.cn/mobi.s?f=web&user=0&source=kwplayerhd_ar_4.3.0.8_tianbao_T1A_qirui.apk&type=convert_url_with_sign&rid=${enc(c.id)}&br=${KW_BR[c.q] || '320kmp3'}`,
    },
    {
      name: '酷我官方mobi',
      from: '旧包 酷我网页版接口（1010 v1.0.0 实测可用）',
      build: c => `https://mobi.kuwo.cn/mobi.s?f=web&type=convert_url_with_sign&rid=${enc(c.id)}&br=${KW_BR[c.q] || '320kmp3'}`,
    },
    {
      name: '酷我antiserver',
      from: '旧包 酷我 anti 接口（1010 v1.0.0 实测可用，返回 https 直链）',
      q: ['320k', '192k', '128k'],
      build: c => `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${enc(c.id)}&format=mp3&response=url`,
    },
    {
      name: '酷我车机版',
      from: '旧包 晴天 / monster 同款车机接口',
      build: c => `https://mobi.kuwo.cn/mobi.s?f=web&user=0&source=kwplayercar_ar_6.0.0.9_B_jiakong_vh.apk&type=convert_url_with_sign&br=${KW_BR[c.q] || '320kmp3'}&sig=0&rid=${enc(c.id)}`,
      headers: { 'User-Agent': UA_ANDROID },
    },
    {
      name: '酷我车机版(fish)',
      from: '上游 fish v1.0.1(latest) 实测在用的 keluze 车机源',
      build: c => `https://mobi.kuwo.cn/mobi.s?f=web&user=0&source=${KUWO_CAR_SRC}&type=convert_url_with_sign&br=${KW_BR[c.q] || '320kmp3'}&sig=0&rid=${enc(c.id)}`,
      headers: { 'User-Agent': UA_ANDROID },
    },
    {
      name: '酷我surl版',
      from: '旧包 小熊猫 / 晴天 同款 mobi 接口',
      build: c => `https://mobi.kuwo.cn/mobi.s?f=web&rid=${enc(c.id)}&br=${KW_BR[c.q] || '320kmp3'}&source=jiakong&type=convert_url_with_sign&surl=1`,
    },
    {
      name: 'HYW',
      from: '上游 HYW 公益版',
      q: ['flac24bit', 'flac', '320k', '128k'],
      build: c => `http://103.79.184.97/api/music/url?source=kw&songId=${enc(c.id)}&quality=${c.q}&key=6C1F-53W0-GRKI-EVFG`,
    },
    {
      name: '海棠w酷我',
      from: 'pdone 11-08 新增源 非常刀 v5（feichangdao）：302 直跳真实音频，需跟随跳转',
      asStream: true,
      q: ['flac', '320k', '128k'],
      build: c => `https://musicapi.haitangw.net/music/kw.php?type=mp3&id=${enc(c.id)}&level=${HW_KW_LV[c.q] || '320'}`,
    },
  ],

  kg: [
    {
      name: '星海KG',
      from: '上游 星海（旧包无可用酷狗链路，此为唯一原生酷狗接口）',
      // 上游 flac 支持不稳（偶发 KG_SONG_NOT_FOUND 且耗时 2~18s），只挂 320k/128k，flac 请求走降级
      q: ['320k', '128k'],
      build: c => `https://yy.zddyr.top/lx/api/?source=kg&quality=${enc(c.q)}&mainHash=${enc(c.id)}`,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    },
    {
      name: '酷我检索备用',
      from: '旧包 fish v1.0.1 的跨平台思路（酷我搜索 + 车机取链），本文件重写为严格匹配版',
      // 没有酷狗 ID 也能跑：只靠歌名 + 歌手；实测车机接口连 flac 也能出真无损
      needName: true,
      q: ['flac', '320k', '128k'],
      build: c => `http://search.kuwo.cn/r.s?all=${enc(c.name + ' ' + c.singer)}&ft=music&itemset=web_2013&client=kt&pn=0&rn=30&rformat=json&encoding=utf8`,
      headers: H_KW,
      parse: async (body, c) => {
        const list = parseKuwoSearch(String(body || ''))
        const hit = pickKuwoExact(list, c.name, c.singer)
        if (!hit) throw new Error('酷我无同名原版，放弃（防串歌）')
        const r2 = await httpGet(`https://mobi.kuwo.cn/mobi.s?f=web&user=0&source=${KUWO_CAR_SRC}&type=convert_url_with_sign&br=${KW_BR[c.q] || '320kmp3'}&sig=0&rid=${enc(hit.rid)}`, { headers: H_KW })
        return pickUrl(r2)
      },
    },
  ],

  mg: [
    {
      name: '溯音咪咕(歌手)',
      from: '旧包 溯音系 / 上游 922 接口',
      needName: true,
      build: c => `https://oiapi.net/api/MiGu_Music?msg=${enc(c.name + ' ' + c.singer)}&n=1&type=json`,
      parse: (b, c) => {
        if (!singerHit(pickField(b && b.data, ['singer', 'singers', 'artist']), c.singer)) return null
        return pickUrl(b)
      },
    },
    {
      name: '溯音咪咕',
      from: '旧包 溯音系 / 上游 922 接口',
      needName: true,
      build: c => `https://oiapi.net/api/MiGu_Music?msg=${enc(c.name)}&n=1&type=json`,
      parse: (b, c) => {
        if (!singerHit(pickField(b && b.data, ['singer', 'singers', 'artist']), c.singer)) return null
        return pickUrl(b)
      },
    },
    {
      name: '酷我检索备用',
      from: '旧包 fish v1.0.1 的跨平台思路，本文件重写为严格匹配版',
      needName: true,
      q: ['320k', '128k'],
      build: c => `http://search.kuwo.cn/r.s?all=${enc(c.name + ' ' + c.singer)}&ft=music&itemset=web_2013&client=kt&pn=0&rn=30&rformat=json&encoding=utf8`,
      headers: H_KW,
      parse: async (body, c) => {
        const list = parseKuwoSearch(String(body || ''))
        const hit = pickKuwoExact(list, c.name, c.singer)
        if (!hit) throw new Error('酷我无同名原版，放弃（防串歌）')
        const r2 = await httpGet(`https://mobi.kuwo.cn/mobi.s?f=web&user=0&source=${KUWO_CAR_SRC}&type=convert_url_with_sign&br=${KW_BR[c.q] || '320kmp3'}&sig=0&rid=${enc(hit.rid)}`, { headers: H_KW })
        return pickUrl(r2)
      },
    },
  ],
}

// ==================== 链路健康度 + 实测延迟 ====================
const health = Object.create(null)   // name -> { fail, until, ema }
function isCooling(name) {
  const h = health[name]
  if (!h) return false
  return h.fail >= CFG.failThreshold && Date.now() < h.until
}
function markOk(name, ms) {
  const h = health[name] || (health[name] = { fail: 0, until: 0, ema: ms || 0 })
  h.fail = 0
  h.until = 0
  // 指数滑动平均：新样本权重 1/4，把稳定快的链路沉到前面
  h.ema = h.ema ? Math.round(h.ema * 0.75 + (ms || 0) * 0.25) : (ms || 0)
}
function markFail(name) {
  const h = health[name] || (health[name] = { fail: 0, until: 0, ema: 0 })
  h.fail += 1
  if (h.fail >= CFG.failThreshold) h.until = Date.now() + CFG.cooldown
}

/** 同优先级内按健康度+延迟排序：冷却的沉底，其余按 EMA 升序（未知延迟保持原序） */
function orderLinks(links) {
  return links
    .map((l, i) => ({ l, i, h: health[l.name] }))
    .sort((a, b) => {
      const ca = isCooling(a.l.name) ? 1 : 0
      const cb = isCooling(b.l.name) ? 1 : 0
      if (ca !== cb) return ca - cb
      const ea = a.h && a.h.ema ? a.h.ema : 99999
      const eb = b.h && b.h.ema ? b.h.ema : 99999
      if (ea !== eb) return ea - eb
      return a.i - b.i
    })
    .map(x => x.l)
}

// ==================== 缓存 ====================
const cache = new Map()
function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.t > CFG.cacheTTL) { cache.delete(key); return null }
  return hit.url
}
function cacheSet(key, url) {
  cache.set(key, { url, t: Date.now() })
  if (cache.size > CFG.cacheMax) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
}

// ==================== 可播放性预检 ====================
/** 取响应头里的音频总字节数（Content-Range: bytes 0-1023/8419395），拿不到返回 0 */
function totalBytes(res) {
  const h = (res && res.headers) || {}
  const key = Object.keys(h).find(k => k.toLowerCase() === 'content-range')
  if (!key) return 0
  const m = /\/(\d+)$/.exec(String(h[key] || '').trim())
  return m ? Number(m[1]) : 0
}

/** asStream 类链路（302 直跳音频）用它判断是不是试听片段：整首不到 500KB 基本就是 22s 试听 */
function probeSize(url) {
  if (!CFG.enablePrecheck) return Promise.resolve({ ok: true, total: 0 })
  return new Promise(resolve => {
    let settled = false
    const done = v => { if (!settled) { settled = true; resolve(v) } }
    const timer = setTimeout(() => done({ ok: true, total: 0 }), CFG.precheckTimeout)
    try {
      request(url, { method: 'GET', timeout: CFG.precheckTimeout, headers: { 'User-Agent': UA, Range: 'bytes=0-511' } }, (err, res) => {
        clearTimeout(timer)
        if (err) return done({ ok: true, total: 0 })
        const code = (res && res.statusCode) || 0
        if (code >= 400) return done({ ok: false, total: 0 })
        done({ ok: true, total: totalBytes(res) })
      })
    } catch (e) { clearTimeout(timer); done({ ok: true, total: 0 }) }
  })
}

function precheck(url) {
  if (!CFG.enablePrecheck) return Promise.resolve(true)
  return new Promise(resolve => {
    let settled = false
    const done = v => { if (!settled) { settled = true; resolve(v) } }
    const timer = setTimeout(() => done(true), CFG.precheckTimeout)
    try {
      request(url, { method: 'GET', timeout: CFG.precheckTimeout, headers: { 'User-Agent': UA, Range: 'bytes=0-511' } }, (err, res) => {
        clearTimeout(timer)
        if (err) return done(true)   // 网络抖动不判死，交给播放器
        const code = (res && res.statusCode) || 0
        if (code >= 400) return done(false)
        // 手机版的 request 对二进制流可能不给 statusCode（code=0），此时不能判死，交给播放器
        if (!code) return done(true)
        const body = res && res.body
        if (typeof body === 'string' && (/^\s*<(!doctype|html)/i.test(body) || /^\s*\{/.test(body))) return done(false)
        done(true)
      })
    } catch (e) { clearTimeout(timer); done(true) }
  })
}

/**
 * 强制 https：各平台接口返回的 CDN 直链常写成 http://，手机版（Android）会拦明文请求，
 * 表现为"取到链接但一点声音都没有"。以下 CDN 均已实测同时支持 TLS，改写为 https 无副作用。
 * 覆盖：酷我(car-er/other-er/kw-er)、网易(m701/m801 music.126.net)、
 *      QQ(ws/isure/aqqmusic stream.qqmusic.qq.com、aqqmusic.tc.qq.com)、咪咕(freetyst.nf.migu.cn)
 */
const SECURE_RE = /^http:\/\/(?:[a-z0-9-]+\.)*(?:kuwo\.cn|music\.126\.net|qqmusic\.qq\.com|tc\.qq\.com|migu\.cn)\//i
function toSecure(url) {
  if (typeof url !== 'string') return url
  return SECURE_RE.test(url) ? url.replace(/^http:/i, 'https:') : url
}

// ==================== 单链路执行 ====================
async function runLink(link, ctx) {
  const t0 = Date.now()
  // asStream：build() 直接给的就是可播地址（多为 302 跳真实音频），不需要再解析接口正文
  if (link.asStream) {
    const direct = toSecure(link.build(ctx))
    if (!/^https?:\/\//i.test(direct)) throw new Error('直链无效')
    if (!(await precheck(direct))) throw new Error('直链不可播放')
    const meta = await probeSize(direct)
    const preview = meta.total > 0 && meta.total < 500000
    return { url: direct, ms: Date.now() - t0, preview }
  }
  const o = (typeof link.opts === 'function' ? link.opts(ctx) : link.opts) || {}
  const body = await httpGet(link.build(ctx), {
    method: o.method,
    body: o.body,
    headers: Object.assign({}, H_JSON, link.headers || {}, o.headers || {}),
    timeout: CFG.reqTimeout,
  })
  // parse 允许异步（两段式链路：先检索再取链）
  let direct = link.parse ? link.parse(body, ctx) : pickUrl(body)
  if (direct && typeof direct.then === 'function') direct = await direct
  if (!isLikelyAudio(direct)) throw new Error('未取到直链')
  direct = toSecure(direct)
  if (!(await precheck(direct))) throw new Error('直链不可播放')
  // 酷我对 VIP/付费曲只给 aac 试听片段（约 22s），URL 特征：路径 .aac 或 query 带 format$aac
  const preview = /\.aac(?:[?#]|$)/i.test(direct) || /[?&]format\$aac/i.test(direct)
  return { url: direct, ms: Date.now() - t0, preview }
}

// ==================== 调度：按音质分层 + 优先级并发 + 串行兜底 ====================
async function tryChain(links, ctx, ck) {
  const errors = []
  const linksSorted = orderLinks(links)
  if (!linksSorted.length) return { url: null, errors: ['该音质无可用链路'] }

  const batch = linksSorted.slice(0, CFG.concurrent)
  // 试听片段（酷我 VIP 只给 22s aac）先存着，优先继续找完整曲，全挂了再用它兜底
  const weak = []
  if (batch.length) {
    const results = await Promise.allSettled(batch.map(l => runLink(l, ctx)))
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled') {
        if (r.value.preview) { weak.push(r.value); errors.push(batch[i].name + ':仅试听片段'); continue }
        markOk(batch[i].name, r.value.ms)
        cacheSet(ck, r.value.url)
        return { url: r.value.url, errors }
      }
      markFail(batch[i].name)
      errors.push(batch[i].name + ':' + ((r.reason && r.reason.message) || '失败'))
    }
  }
  for (const l of linksSorted.slice(CFG.concurrent)) {
    try {
      const r = await runLink(l, ctx)
      if (r.preview) { weak.push(r); errors.push(l.name + ':仅试听片段'); continue }
      markOk(l.name, r.ms)
      cacheSet(ck, r.url)
      return { url: r.url, errors }
    } catch (e) {
      markFail(l.name)
      errors.push(l.name + ':' + (e.message || '失败'))
    }
  }
  if (weak.length) {
    // 所有链路都只有试听 —— 至少把能出声的片段交出去，不让整首歌直接失败
    cacheSet(ck, weak[0].url)
    return { url: weak[0].url, errors, preview: true }
  }
  return { url: null, errors }
}

async function getUrl(platform, musicInfo, requestedQuality) {
  const qualitys = PLATFORM_QUALITY[platform]
  if (!qualitys) throw new Error('不支持的平台: ' + platform)
  const wantQ = selectQuality(requestedQuality, qualitys)
  const id = getSongId(platform, musicInfo)
  const name = getSongName(musicInfo)
  const singer = getSinger(musicInfo)
  if (!id && !name) throw new Error('缺少歌曲 ID / 歌名')

  const ctx = { id, name, singer, q: wantQ, platform }

  const ck = platform + ':' + (id || name) + ':' + wantQ
  const cached = cacheGet(ck)
  if (cached) return cached

  // 先按"能否应付该音质"分层；缺 ID 时只保留按歌名就能跑的链路
  const all = (CHAIN[platform] || []).filter(l => !l.needName || name).filter(l => l.needName || id)
  const usable = all.filter(l => !l.q || l.q.indexOf(wantQ) >= 0)
  const errors = []
  let res = await tryChain(usable, ctx, ck)
  if (res.url) {
    if (res.preview) console.log(`${TAG} ${platform} ${wantQ} 仅取到试听片段（付费曲只给 ~22s，播放会提前结束）`)
    return res.url
  }
  errors.push.apply(errors, res.errors)

  // 该音质专属链路全挂 → 允许能力更宽的链路顶上（可能音质略降）
  const rest = all.filter(l => l.q && l.q.indexOf(wantQ) < 0 && l.q.indexOf('320k') >= 0)
  if (rest.length && wantQ !== '128k') {
    const ctx2 = Object.assign({}, ctx, { q: '320k' })
    res = await tryChain(rest, ctx2, ck)
    if (res.url) {
      console.log(`${TAG} ${platform} ${wantQ} 无专属链路，已用 320k 链路顶上`)
      return res.url
    }
    errors.push.apply(errors, res.errors)
  }

  // 低音质请求失败 → 逐级降档
  if (CFG.enableFallback) {
    for (const alt of degradeList(wantQ, qualitys)) {
      const ctx3 = Object.assign({}, ctx, { q: alt })
      const pool = all.filter(l => !l.q || l.q.indexOf(alt) >= 0)
      const r2 = await tryChain(pool, ctx3, platform + ':' + (id || name) + ':' + alt)
      if (r2.url) {
        console.log(`${TAG} ${platform} ${wantQ} 全链失败，已降级到 ${alt}`)
        cacheSet(ck, r2.url)
        return r2.url
      }
    }
  }
  console.log(`${TAG} ${platform} ${wantQ} 全部链路失败 → ` + errors.join(' | '))
  throw new Error('全部链路失败 → ' + errors.join(' | '))
}

// ==================== 注册 ====================
const sourceConfig = {}
Object.keys(PLATFORM_QUALITY).forEach(p => {
  sourceConfig[p] = {
    name: PLATFORM_NAMES[p],
    type: 'music',
    actions: ['musicUrl'],
    qualitys: PLATFORM_QUALITY[p],
  }
})

on(EVENT_NAMES.request, ({ action, source, info }) => {
  if (action !== 'musicUrl') return Promise.reject(new Error('action not support'))
  if (!sourceConfig[source]) return Promise.reject(new Error('source not support'))
  const musicInfo = info && info.musicInfo
  if (!musicInfo) return Promise.reject(new Error('请求参数不完整'))
  return getUrl(source, musicInfo, (info && info.type) || '128k')
})

send(EVENT_NAMES.inited, { openDevTools: false, sources: sourceConfig })

// 供离线测试脚本调用（载入后可用 node test-chains.js 逐链路实测）
globalThis.__X = { CFG, CHAIN, getUrl, runLink, tryChain, pickUrl, health, sourceConfig, parseKuwoSearch, pickKuwoExact, toSecure }

console.log(`${TAG} YY Zone🎵音源 v1.3.0 已加载 —— wy/tx/kw/kg/mg，共 ` +
  Object.keys(CHAIN).map(p => p + ':' + CHAIN[p].length).join(' / '))
