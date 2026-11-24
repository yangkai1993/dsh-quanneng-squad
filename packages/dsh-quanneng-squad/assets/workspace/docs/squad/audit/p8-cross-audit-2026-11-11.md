# P8 交叉审计 · 第一轮（2026-11-11，御史大夫@v15，未参与独立审计）

> 对象：本轮 captain 改动的 9 个脚本 + 2 个门禁文档。方法：全量 read + 实跑 5 门 + 12 组负向/旁路探针（探针一律落在 .tmp-p8-probe / 注入行即时还原，仓库零残留）。与 captain 自查冲突处，以本报告实测为准。
> 审计人声明：本人未参与上述任何文件的本轮改动。

## 逐条判定（P1~P8）

### P1 自洽绿灯 —— 命中（部分缓解）
- 证据：verify.mjs:103-131「豁免解析器 fail-closed」用例：自己写探针 EXEMPTIONS.md，再用**同一解析器**读回断言 —— 同实现自洽往返，无第二实现/外部真值对照（P1 定义的反例本身：G-REFLOW.md:8）。
- 缓解：verify.mjs:132-149 用子进程实跑 reflow-check 检查 stdout 纯 JSON + stderr 留痕，属行为级测试。
- 缺外部真值处：seat-utilization.mjs:11-28 座位目录/正则硬编码于脚本内，与 FUNCTION-LEDGER 无交叉核对；roster-snapshot.json 由 export-roster 生成、audit-roster 消费，两者同源（见 P6）。

### P2 入参存在≠生效 —— 命中
- **QUANNENG_EXPECTED_MODEL 死参数**：audit-roster.mjs:27 定义、:60 仅回显 JSON；阻断判定（:46-53）只比较 profileDefault 派生值，expected 从未参与判定。实测：QUANNENG_EXPECTED_MODEL=ghost/bogus → exit 0、warnings=[]。
- SQID（audit-roster.mjs:13）同为回显参数，硬编码默认值 baa0a893-… 与实际 team id（.agent-teams/quanneng-squad/team.json = "quanneng-squad"）不符，无消费点。
- QUANNENG_WORKSPACE 对 audit-roster 部分失效：快照路径硬编码 join(root, assets/roster-snapshot.json)（audit-roster.mjs:30），不随 workspace env 切换，隔离工作区无法独立测试该门。
- 已生效（实测区分）：QUANNENG_ALLOW_IDLE / ALLOW_DRIFT / ALLOW_ORDER_GAP / ALLOW_REFLOW_GAP 四个 env 开关均实测使 exit 1→0，豁免变量无静默失效。
- drift-check.mjs:14,174 情报时效仅 stderr 提醒不入阻断（注释明示，记为知情弱化，非静默失效）。

### P3 叙述性声明当验收 —— 命中
- verify.mjs:45-51（memory.mjs 源码压平后 includes "functionexportMd"/"asyncfunctioncloud"）、:62-63（源码形态正则）、:68（导入符号计数>20）、:90-91（断言脚本包含某字符串且不含另一些字符串来证明「默认阻断」）、:155（用正则从 exemptions.mjs 源码抠 GATE_IDS 当真源）。
- :155 双向自洽风险：GATE_IDS 既当解析器白名单又当 verify 判定依据，同改同变 = 永真断言。
- 同文件内做得对的：:83-86 compatibility 版本一致性、:97-102 跨工件版本对照，非源码形态匹配。

### P4 替换式打补丁 —— 待验
- 本轮 10 文件无逐文件四步留痕（--check / 实跑 / 负向验证输出）可考；STATE.md:119 仅轮级一句「负向验证通过」，未指明覆盖哪些文件。
- 旁证正向：5 门实跑全可运行、verify 43/43，未发生 P4 典型回归；但「未发生」≠「走过四步」，按 P1 口径判待验，不由审计人代填。

### P5 未验证的环境假设 —— 命中（1 处 fail-open）
- **audit-roster 在 profile 不可读时空转放行**：audit-roster.mjs:18-24 try/catch 吞读取失败 → profileDefault=null → :47 if (profileDefault && seats.length) 整段跳过 → exit 0、warnings=[]。实测：USERPROFILE 指向不存在目录 → profileDefault=null、exit 0。宿主环境异常时该门静默变绿，fail-open。
- 其余通过：install.mjs:11-16 skipDir/purgeDir 与 verify.mjs:106-108 的「本宿主 env 空、os.tmpdir() 不可用、探针落工作区」假设自洽；bare-env 下各门未崩（cmd 实跑）。

### P6 上级输入未核验 —— 命中
- roster-snapshot.json 被当真值：export-roster.mjs:28-29 接受 --seats "角色=模型,…" **手工键入清单**直接落盘；audit-roster 只查快照时效（>24h 告警），不核验来源。captain 导什么，门就审什么。
- 实测快照：takenAt=2026-11-11T08:41Z、16 席、model=glm-5.3-flash（无 provider 比对，见 P8 audit-roster 判定）。快照座位号未被脚本独立复核。

### P7 激活≠驱动 —— 命中（判定语义层）
- stage-order.mjs:30-44「阶段已发生」= 目录存在匹配文件名的文件：历史轮工件使 S9/S8 永久 present，越序检测随迭代钝化。
- seat-utilization.mjs:42-51 统计累计工件数：本轮零产出但历史有文件的席位永远绿 —— 「有产出过」被当「本轮在产出」。
- JSON 输出字段名如实，无「跑过了=验证过了」的表述；扣分在判定语义而非表述。

### P8 门禁能否拦截 captain —— 逐门实测矩阵
| 门 | 注入违规 | 负向结果 | captain 自免路径（实测） |
| --- | --- | --- | --- |
| stage-order | 探针工作区 S4 有码前置全空 | exit 1（5 条越序） | 未来到期行 exit 0；env 一行 exit 0；当前真实仓库 6 条越序正被 captain 自签豁免压制（EXEMPTIONS.md:10，到期 2026-11-12，登记人=总指挥） |
| seat-utilization | 探针空工作区 | exit 1（idle=15） | env / 未来行均 exit 0 |
| drift-check | PIPELINE.md 注入死指针 | exit 1（deadPointers=1；原文件还原后复跑 exit 0） | env exit 0；且可直接改 SCAN_DOCS（drift-check.mjs:16-27）摘除被审文档 |
| reflow-check | 抹掉全部提示词 [P] 标记 | exit 1（P1 仅 0 份…） | 名义能；实质拦不住：在任意两份提示词补 [P1] 字样即凑数过关 —— 标记计数不可验语义，正是 G-REFLOW.md:10 P3 所述形态 |
| audit-roster | 席位路由落后 profile 默认 | 弱：比对只看 model basename includes（:48-49），provider 不同不告警；profile 不可读整体放行（见 P5） | 多种静默放行路径 |
| verify | 43/43（实测） | — | 断言多为文本匹配（P3），同文件可改 |

结论：机制在、5/5 负向注入真会阻断，但所有旁路钥匙（env 开关、EXEMPTIONS.md 自签行、直接改脚本）都在 captain 一人手里，无第二人登记/复核豁免的要求。P8 交叉审计目前只是流程约定，G-REFLOW.md:16 P8 行拦截席位仍写「总指挥（自审）」。

## 缺陷单（只开指针，未修）
- D-31-02-A（中）：audit-roster profile 不可读 → fail-open 放行。audit-roster.mjs:18-24,47。
- D-31-02-B（中）：QUANNENG_EXPECTED_MODEL 死参数 + SQID 死值。audit-roster.mjs:13,27,60。
- D-31-02-C（中）：audit-roster 席位比对忽略 provider、仅 includes basename，易漏报。audit-roster.mjs:48-49。
- D-31-02-D（低）：G-REFLOW.md P8 行拦截席位仍为「总指挥（自审）」，与交叉审计派活口径不一致；反哺规则无第 5/6 条；规则 1 机器标记范围写 [P1]…[P7] 而 reflow-check 已计 P8（G-REFLOW.md:16,21 vs reflow-check.mjs:11）。
- D-31-02-E（低）：verify.mjs 大量源码形态/文本匹配断言（:45-51,90-91,155），改注释即可翻转结论。
- D-31-02-F（低）：stage-order / seat-utilization 用历史累计文件存在当阶段已发生，随迭代钝化（stage-order.mjs:44、seat-utilization.mjs:51）。

## 总判定：本轮 captain 改动 —— 有条件放行
1. 放行依据：5 门负向注入全部阻断（exit 1）、旁路行为符合文档承诺、verify 43/43、实跑零崩溃；stage-order 现存 6 条越序有登记豁免（到期 2026-11-12、带闭合条件），形式合规。
2. 放行条件：D-31-02-A/B/C（均指向 audit-roster）须下轮修复并附负向验证；D-31-02-D 文档口径随修。
3. 不放行项：无 —— 未发现本轮改动引入静默失效或假绿主干。
4. 残余风险：豁免签发权单点在 captain（结构性，审计只能留痕不能收权）；建议 EXEMPTIONS.md 增加「登记人 ≠ 被豁免门禁改动人」校验或第二人联签。
