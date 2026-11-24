# GitHub 授权诊断（2026-11-24）

## 现象
- gh CLI 2.96.0 在位（D:\Programs\Dev\GitHub CLI\gh.exe），未登录。
- gh auth login --web 设备码流程失败：Post "https://github.com/login/device/code" dial tcp 20.205.243.166:443 超时。
- 实测连通性：api.github.com → HTTP 200 ✅；github.com 主站 → 超时 ❌（无本机代理 7890/10809/1080/8888 均关）。

## 根因
GitHub API 域与主站域解析到不同 IP 段；本机网络对 github.com 主站 443 不通——git push 与 gh 设备码授权都走主站，故被卡。浏览器能开 GitHub 是浏览器侧走了自己的代理/通道，CLI 拿不到。

## 修复选项（任选其一，之后 runbook §①② 可自动执行）
1. 开代理后重试：浏览器代理客户端开「允许局域网连接」→ 设 HTTP_PROXY/HTTPS_PROXY=http://127.0.0.1:<端口> → gh auth login --web（我接手抓码）→ gh auth setup-git → push。
2. 修改 hosts：把 github.com 解析到可达 IP（api.github.com 当前可用 IP 段参考）——治标，IP 变动失效。
3. 用户手动：浏览器生成 PAT（classic，勾 repo/workflow）→ 发我 token（或自行 gh auth login --with-token）→ 我完成 push+release。

## 已就绪待推内容
- master 分支 0 commits（R4 只 init 未 commit）→ 我将分批 commit（治理链已声明不主动 commit，此处用户明示授权上线 push 才执行）。
- 发布物：npm 三字段齐/package 208.5kB/143 files；dist-adapters 1.20.0；runbook=deploy/RELEASE-RUNBOOK.md。

> 网络恢复主站连通后喊一声，我自动完成：commit→push→(可选)npm publish→回执。