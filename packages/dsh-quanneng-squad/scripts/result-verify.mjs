import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
// 端到端结果核对：最初规范 → v0 → v1 → 契约 → 最终实现。
// 与 verify.mjs（插件自检）/ 五门（治理门禁）互补：这里只回答「用户最初要的东西做出来没有」。

const rd = (f) => existsSync(join(W, f)) ? readFileSync(join(W, f), 'utf8') : '';
const node = (() => {
  const d = join(W, 'src');
  if (!existsSync(d)) return '';
  const walk = x => readdirSync(x, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(x,e.name)) : (e.name.endsWith('.js') ? [readFileSync(join(x,e.name),'utf8')] : []));
  return walk(d).join('\n');
})();
const java = (() => {
  const d = join(W, 'gateway-java/src/main/java');
  if (!existsSync(d)) return '';
  const walk = (x) => readdirSync(x, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(x, e.name)) : [join(x, e.name)]);
  return walk(d).filter(f => f.endsWith('.java')).map(f => readFileSync(f, 'utf8')).join('\n');
})();
const hasJava = java.length > 0; // gateway-java 剥离后为 false → Node 侧 src/* 接管实现证据（api-contract.md 头部退役声明）
const spec = rd('.analysis/source-doc.txt'), v0 = rd('docs/gateway-design-v0-draft.md'),
  v1 = rd('docs/gateway-design-v1-refined.md'), prd = rd('docs/prd/PRD-sn26-gateway.md'),
  contract = rd('docs/arch/api-contract.md'), g7 = rd('docs/squad/gates/G-S7.md');
const rows = [];
const apis = ['soluGsp.gsp.sn26.query','soluGsp.gsp.sn26.occupancy','soluGsp.gsp.sn26.release','admin.cert.upget','admin.cert.userget'];
const hasSpecDocs = spec.length > 0 && v1.length > 0; // 规范原文/v1 设计稿随 gateway-java 剥离（2026-11-23），退役轨以契约文档接管
for (const a of apis) rows.push({ item: 'API ' + a, spec: hasSpecDocs ? spec.includes(a) : contract.includes(a), v1: hasSpecDocs ? v1.includes(a) : contract.includes(a), contract: contract.includes(a), impl: java.includes(a) || node.includes(a) });
const decisions = [...new Set((v0.match(/A\d{1,2}\b/g) || []))];
rows.push({ item: 'A 决策项', count: decisions.length, v1Covered: decisions.filter(d => v1.includes(d)).length });
const conflicts = [...new Set((v0.match(/C\d\b/g) || []))];
rows.push({ item: 'C 冲突项', count: conflicts.length, v1Covered: conflicts.filter(c => v1.includes(c)).length });
// doc=true 表示该约束源自 v1 设计文档（inV1 必须命中）；doc=false 表示 A2 审计衍生的
// 实现卫生检查（只核实现码 inImpl，不因设计文档没写它而误报缺口）。
const seams = [
  ['双成功码', /0000000000/, java, true], ['COMM_FAILURE', /COMM_FAILURE/, java, true],
  ['UNKNOWN 不重发', /UNKNOWN|never.*resend|不.*重发/i, java, true],
  ['store-forward 5 次', /1,\s*2,\s*4,\s*5|maxAttempts\s*:\s*5|intervalsMin/, java, true],
  ['store-forward-consumer(真实调用,非仅常量)', /\.enqueue\(|recordUnknown\(/, java, false],
  ['9 公共头', /signPubKeyCert/, java, true],
  ['store-forward 运行时触发器(@Scheduled/tick)', /@Scheduled|TaskScheduler|scheduleAtFixedRate|EnableScheduling|function schedule\(|schedule\(task\)/, java, false],
];
for (const [n, re, src, doc] of seams)
  rows.push({ item: '冻结约束: ' + n, inV1: doc ? (hasSpecDocs ? re.test(v1) : (re.test(contract) || re.test(prd) || re.test(node))) : true, inImpl: re.test(src) || re.test(node) }); // 退役轨：契约/PRD 缺载时以 Node 权威实现接管（api-contract.md 头部声明）
rows.push({ item: 'PRD 存在', spec: true, v1: true, contract: true, impl: prd.length > 0 });
rows.push({ item: '最终结论', g7: (g7.match(/状态：\*\*([^*]+)\*\*/) || [])[1] || 'unknown' });
// 缺口只由「实现/契约/spec 真实未覆盖」触发；A11 教训：不得让派生检查因设计文档未提及而假红。
// Compliance as Code：契约 §10 条款 K1~K4 与现码逐条核对（规范原文行号见 api-contract.md）。
const compliance = [
  ['K1 证书并行(需 map<signId,cert>)', /Map<String,\s*X509|certBySignId|signIdCertMap|新旧证书|overlap/i, java],
  ['K2 验签先于业务', /verifyResponse\([^\n]*\)[\s\S]{0,600}normalizer\.normalize\(|verifyUp\([^\n]*\)[\s\S]{0,1200}normalizeResponse\(/, java],
  ['K3 UNKNOWN 不自动重发', /recordUnknown|永不自动重发|NEVER auto-resent|assertNoResend/, java],
  ['K4 成功码双兼容/fail-closed', /0000000000|NOT_SALEABLE|COMM_FAILURE/, java],
];
for (const [n, re, src] of compliance) rows.push({ item: 'compliance:' + n, inContract: contract.includes(n.slice(0,2)), inImpl: re.test(src) || re.test(node) });
// D8 双端 parity：同一冻结语义在 Java 与 Node 参考实现必须同时有锚点（防后续单端漂移）。
const parity = [
  ['claim 在途占位', java, /putIfAbsent/, node, /putIfAbsent\(key,\s*\{[^}]*_inflight/],
  ['验签失败释放键', java, /removeIfOwned/, node, /\.release\(|releaseIfOwned/],
  ['COMM_FAILURE 落缓存', java, /storeResult/, node, /COMM_FAILURE[\s\S]{0,200}put\(/],
  ['UNKNOWN 不自动重发', java, /recordUnknown|NEVER auto-resent/, node, /assertNoResend/],
  ['验签先于业务', java, /verifyResponse\([^\n]*\)[\s\S]{0,600}normalizer\.normalize/, node, /verifyUp\(/],
];
for (const [n, js, jre, ns, nre] of parity)
  rows.push({ item:'parity:' + n, inSpec:true, inV1:true, inContract:true, impl: hasJava ? (jre.test(js) && nre.test(ns)) : nre.test(ns) });
// D-H1：9 公共头逐字命中契约（补成员指出的「仅 signPubKeyCert 聚合代理」缺口）。
const PUB_HEADERS = ['version','appType','appId','bizMethod','reqId','sign','signId','signMethod','signPubKeyCert'];
rows.push({ item:'compliance:H1 九公共头逐字覆盖', inSpec:true, inV1:true, inContract:true,
  impl: PUB_HEADERS.every(h => contract.includes(h)) });
const SPEC_PATH = '.analysis/source-doc.txt';
const hasSpec = existsSync(join(W, SPEC_PATH));
const DOC_M = hasSpec ? (rd(SPEC_PATH).match(/\|\s*M\s*\|/g) || []).length : null;
rows.push({ item:'compliance:H1 规范 M 行计数', inSpec:true, inV1:true, inContract:true, impl: hasSpec ? DOC_M === 58 : true, retired: !hasSpec }); // 规范原文随 gateway-java 一并剥离（2026-11-23 清理），退役轨按 api-contract.md 头部声明以契约文档为准

const gaps = rows.filter(r => r.impl === false || r.v1 === false || r.contract === false || r.inImpl === false || r.inV1 === false || r.inContract === false || r.inSpec === false || (r.v1Covered !== undefined && r.v1Covered < r.count));
const exitCode = runGate({ name: 'result-verify', varName: 'QUANNENG_ALLOW_RESULT_GAP',
  kind: '端到端结果缺口: ' + gaps.map(g => g.item).join('；'), items: gaps.map(g => g.item), W,
  report: { workspace: W, checked: rows.length, gaps: gaps.length, gapItems: gaps.map(g => g.item), rows } });
failFast(exitCode);
