# TV 播放源聚合器（影视 + 直播 · 自动更新）

把各路优秀、稳定的影视点播源与电视直播源聚合到 **一个 GitHub 仓库**，由 GitHub Actions 每天定时重新生成并提交，播放器只需填一个配置地址即可长期看，直播源自动保持最新。

> ⚠️ 所有源均来自网络公开资源 / 第三方，随时可能失效，**仅供个人学习测试**。请仅使用你有权使用的内容，注意版权与合规。

---

## 产物与配置地址

仓库每天自动生成并提交了三个文件，复制下面地址填进播放器即可（把 `<你的用户名>` 换成你的 GitHub 账号名）：

| 用途 | 文件名 | 配置地址（推荐走 gh-proxy，国内快） |
|---|---|---|
| **影视（多仓·推荐）** | `aggregate.json` | `https://gh-proxy.com/https://raw.githubusercontent.com/<你的用户名>/tv-source-aggregator/main/aggregate.json` |
| 影视（合并单仓·进阶） | `tv.json` | `https://gh-proxy.com/https://raw.githubusercontent.com/<你的用户名>/tv-source-aggregator/main/tv.json` |
| **电视直播（自动更新）** | `live.m3u` | `https://gh-proxy.com/https://raw.githubusercontent.com/<你的用户名>/tv-source-aggregator/main/live.m3u` |

> 原始直连地址（不绕代理）：把上面 `https://gh-proxy.com/` 去掉即可。国内网络建议保留 gh-proxy 前缀。

---

## 怎么用（播放器端）

### 影视仓 / TVBox（点播）
1. 安装影视仓或 TVBox（takagen99 版）到电视 / 盒子。
2. 设置 → 配置地址 → 粘贴上面的 **aggregate.json** 地址 → 确定 → 等待导入。
3. 首页出现分类海报即成功，搜索片名即可播放；某条线路转圈就切线路 / 清缓存重导。

### 影视仓 / TiviMate / PotPlayer（直播）
- 影视仓：设置 → 直播源 → 导入 → 粘贴 **live.m3u** 地址。
- TiviMate / PotPlayer：添加 playlist → 粘贴 **live.m3u** 地址。

---

## 部署到 GitHub（一次性）

本机已搭好整套仓库，你只需建仓并推送：

```bash
cd tv-source-aggregator
git init
git add -A
git commit -m "init: TV 播放源聚合器"

# 方式 A：已装 gh
gh repo create tv-source-aggregator --public
git branch -M main
git push -u origin main

# 方式 B：手动建仓后
# 在 github.com 新建空仓库 tv-source-aggregator（不要勾 README）
git branch -M main
git remote add origin https://github.com/<你的用户名>/tv-source-aggregator.git
git push -u origin main
```

推送后：
- 进入仓库 **Settings → Actions → General → Workflow permissions**，确认是 **Read and write**（工作流里已声明 `permissions: contents: write`，通常默认即可）。
- 进入 **Actions** 标签页，手动跑一次 **Update Sources** 验证；之后每天北京时间 01:00 自动更新。
- 想立刻更新？Actions 页面点 **Update Sources → Run workflow**。

---

## 怎么增删源（按需自定义）

全部源集中在两个清单文件，改完提交，Actions 下次运行自动生效：

- `sources.json` — 影视点播源（单仓地址）。`name` 是显示名，`url` 是配置地址。
- `live_sources.json` — 电视直播源（m3u 地址列表）。

挑选源的原则：
- 优先选 **GitHub / jsDelivr / GitLab / liucn** 托管的地址（GitHub Actions  runner 能稳定抓到，合并单仓 `tv.json` 更全）。
- 国内域名源（如 肥猫 / 饭太硬 / 摸鱼）在 `aggregate.json`（多仓）里照样可用——因为多仓是**播放器**从你家网络去拉，不依赖 Actions 能否访问。

---

## 文件说明

```
tv-source-aggregator/
├── .github/workflows/update.yml   # 每日自动构建并提交
├── build.py                       # 聚合脚本（纯标准库，无依赖）
├── sources.json                   # 影视源清单（可编辑）
├── live_sources.json              # 直播源清单（可编辑）
├── aggregate.json                 # 生成：多仓配置（推荐）
├── tv.json                        # 生成：合并单仓配置（进阶）
├── live.m3u                       # 生成：直播源（自动更新）
├── README.md
├── LICENSE
└── .gitignore
```

## 稳定性说明
- `aggregate.json`（多仓）最稳：某一路失效不影响其他路，且由播放器直连，不依赖 Actions 网络。
- `tv.json`（合并单仓）依赖 Actions 能抓到各源；个别源在 CI 环境拉不到时会缺失，已做「保留上次缓存」兜底。
- `live.m3u` 镜像自 vbskycn（每 6 小时更新）、peterhchina（央视+卫视+地方）、live.zbds.top，去重合并；CI 拉不到时保留缓存。
- 建议每 1~2 个月复查一次 `sources.json` 里的源是否还活跃，移除失效项。
