# 运维 Runbook v1.0

## 启动
```bash
D:/Programs/Dev/nodejs/node.exe src/cli.js
```
端口：北向 18952 / Mock 银联 18950 / 反向接入 18951。

## 验收
```bash
D:/Programs/Dev/nodejs/node.exe --test tests/gateway.test.js
D:/Programs/Dev/nodejs/node.exe --test tests/crypto.selftest.js
```

## 报警与处置
| 级别 | 条件 | 现象 | 定位 | 处置 | 回滚 |
| --- | --- | --- | --- | --- | --- |
| P0 | verifyFail > 0 | 全量响应验签失败 | /admin/metrics、/admin/audit 的 SECURITY 记录 | 核对 signId 证书库与 userId；暂停出域 | 切上一版证书（overlap 3 个月） |
| P1 | UNKNOWN / PENDING_RECON 超阈 | 状态不收敛 | /admin/state、/admin/recon/tick | 定时对账；占用态不自动重发 | 转差错单，人工干预 |
| P1 | 中心错误率 > 0.30 | center-a 失败 | /admin/centers | 自动切 center-b，idemKey 不变 | 探活恢复后回切 |
| P1 | 证书剩余 < 90d | 临期 | /admin/cert/userget | 触发 admin.cert.userget；新旧并行 90d | 旧证书兜底 |
| P2 | UNMAPPED 应答码 | 未知码 | /admin/audit 留痕 | 不猜测，补映射配置 | — |
| P2 | 存储转发积压 | notify 表 due 堆积 | /admin/recon/tick | 1/2/4/5 分钟 5 次，不晚于日切 | 跨日切转人工差错 |

## 日切与差错
日切阈值 23:30；跨日切未收敛的 UNKNOWN 转人工差错单，禁止静默重发。
