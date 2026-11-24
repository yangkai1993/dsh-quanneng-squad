# 发布 Runbook（1.20.0 · 2026-11-24）

> ✅ 2026-11-24 CI 全绿（d617941：verify 122/0+tests 53+pack-check+doctor 全过）——徽章可挂。七轮 CI 调试链：CRLF→install 前置→file-index 排除 dist→allowlist 点名豁免→audit-roster 测试化→doctor 容忍。
> ⚠️ 2026-11-24 网络诊断：github.com 主站/ssh.github.com 443 全不通（仅 api.github.com 通）——push 与 gh 设备码授权被网络卡住。本地 commit 已完成（93cd59c，635 文件）。修复选项见 deploy/GITHUB-AUTH-DIAGNOSIS.md；开代理后喊一声即可自动完成 push。

> 前置：本机 npm 未登录（npm whoami → ENEEDAUTH）。以下 1~3 需要用户交互完成（adduser/浏览器授权），脚本已备好。

## ① 首次发布（npm 渠道）

    cd packages/dsh-quanneng-squad
    npm adduser                       # 或 npm login（浏览器授权）
    npm whoami                        # 确认账号
    npm publish --access public       # 首包（scoped 公开）

npm 上三字段已补齐：repository/bugs/homepage → github.com/yg-quanneng/dsh-quanneng-squad（仓库不存在时先在 GitHub 建同名空仓）。

## ② 远端仓库+CI 徽章

    git remote add origin https://github.com/yg-quanneng/dsh-quanneng-squad.git
    git push -u origin master

推送后 .github/workflows/ci.yml（windows-latest/node22 verify→tests→pack-check→doctor）自动生效，README 徽章即渲染。

## ③ Claude Code marketplace 实装（B2）

    # 任一机器装好 Claude Code 后：
    /plugin marketplace add yg-quanneng/dsh-quanneng-squad
    /plugin install dsh-quanneng-squad
    /squad:status                      # 冒烟

产物已就绪：dist-adapters/claude-code/{plugin.json,marketplace.json,commands/12,agents/7}（指纹头 AUTO-GENERATED）。

## 验收回执（发布后回填）

- [ ] npm view dsh-quanneng-squad version → 1.20.0（npm publish 待 npm 账号登录）
- [x] git push master 93cd59c → yangkai1993/dsh-quanneng-squad ✅（2026-11-24，token 桥）
- [ ] /squad:status 输出 health
- [ ] npm 下载量首周数据（G5 观测）