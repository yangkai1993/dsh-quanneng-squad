# GitHub 授权 · 浏览器最终指引（2026-11-24）

## 已核实的事实
1. DSH 宿主无 GitHub 插件/MCP（.dsh 无 github 目录、.credentials.yaml 无 github 记录、profile 无 mcpServers 段）——可用的 GitHub 能力=gh CLI 2.96.0 + git。
2. gh 设备码流程两度发起（529E-5BED 已作废），均卡死在 POST github.com/login/device/code——**CLI 到 github.com 主站 443 物理不通**（换 IP 段仍超时）；api.github.com 是通的。
3. 浏览器能开 GitHub 页面 = 浏览器自带通道，CLI 借不到。

## 结论
浏览器登录态本身无法传给 CLI；"外部浏览器完成授权"在主站不通的网络上唯一可行桥 = **PAT token**（token 经浏览器生成，粘贴回来）。

## 操作（2 分钟）
1. Chrome 打开：https://github.com/settings/tokens/new
2. Note: dsh-quanneng-squad-release；Expiration: 90 days；勾选 scopes：repo（全部）、workflow。
3. Generate token → 复制 ghp_ 开头的串。
4. 二选一回传：
   a. 直接发我（我用 GH_TOKEN 完成 push+后续全部发布动作）；
   b. 或自己在终端跑：set GH_TOKEN=<粘贴> 后告诉我一声。

5. 我接手后执行：gh auth login --with-token（stdin）→ gh auth setup-git → git remote add origin → git push -u origin master → CI 徽章激活 → 回执。

> 安全注记：token 只落 gh 凭据库（Windows Credential Manager），不入仓库不入 docs；90 天后自动过期。