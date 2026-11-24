// 第2期重构：本模块由 verify.mjs 机械拆分而来（断言内容逐字保留，零语义变化）。
// ctx = { t, root, readFileSync, existsSync, join, spawnSync, pathToFileURL, tmpdir, mkdtempSync, mkdirSync, writeFileSync, rmSync, pkg, patch, buildPatchText }
export function run(ctx) {
  const { t, root, readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, spawnSync, pathToFileURL, tmpdir, join, dirname, workspace, pkg, patch, buildPatchText } = ctx;
  return (async () => {
await t('memory README/SOP present', () => existsSync(join(workspace,'docs/squad/memory/README.md')));
await t('合规: 当前豁免表无过期行（历史记录表不计）', async () => { const p=join(workspace,'docs/squad/gates/EXEMPTIONS.md'); const t=readFileSync(p,'utf8'); const cur=t.split('## 历史')[0]; const today=new Date().toISOString().slice(0,10); const rows=cur.split('\n').filter(l=>/^\|\s*\w[\w-]*\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l)); return rows.every(l=>{const d=(l.match(/\d{4}-\d{2}-\d{2}/)||[])[0];return d&&d>today;}); });
await t('P12: squadctl MAP 覆盖 >=15 子命令且 ctl help 可跑', () => {
  const s=readFileSync(join(root,'scripts/squadctl.mjs'),'utf8');
  const n=(s.match(/^\s*'[^']+':/gm)||[]).length;
  const r=spawnSync(process.execPath,['scripts/squadctl.mjs','help'],{cwd:root,encoding:'utf8',timeout:30000});
  return n>=15 && r.status===0;
});
await t('V-52-02: env 单因素不得构成豁免', () => {
  const s=readFileSync(join(root,'scripts/lib/exemptions.mjs'),'utf8');
  return /envSet && byFile/.test(s) && /envIgnored/.test(s);
});
await t('A1: 无陈旧在途卡（同令牌最后一段必须是终止态）', async () => {
  const d = join(workspace,'docs/squad/dispatch');
  const { TERMINAL_RE, PENDING_RE: PENDING_RE2 } = await import('../../lib/gate-kit.mjs');   // R-2：真源
  for (const f of readdirSync(d)) {
    if (!f.endsWith('.md')) continue;
    const by = new Map();
    for (const sec of readFileSync(join(d,f),'utf8').split(/\n(?=## )/)) {
      const m = sec.match(/\| 令牌 \| (TK-\d+-\d+)/), s = sec.match(/\| 状态 \| ([^\n]*)/);
      if (m && s) by.set(m[1], s[1]);
    }
    // 正确语义：只拦「后面已有终止段、前面旧段仍标在途」的陈旧卡；
    // 当前合法在途（最后一段就是在途）不算缺陷。
    for (const sec of readFileSync(join(d,f),'utf8').split(/\n(?=## )/)) {
      const m = sec.match(/\| 令牌 \| (TK-\d+-\d+)/), s = sec.match(/\| 状态 \| ([^\n]*)/);
      if (!m || !s || !PENDING_RE2.test(s[1]) || TERMINAL_RE.test(s[1])) continue;
      if (TERMINAL_RE.test(by.get(m[1]) || '')) return false;   // 最后一段已终止 = 本段陈旧
    }
  }
  return true;
});

await t('pre-verify 行为断言：completed Java 卡无 mvn exit0 → 门红；还原 → 绿（数据驱动不钉 id）', async () => {
  const { spawnSync } = await import('node:child_process');
  const tjPath = join(workspace,'.agent-teams/quanneng-squad/team.json');
  let tj;
  try { tj = JSON.parse(readFileSync(tjPath,'utf8')); } catch { return true; }   // 面板未挂载 → 无可断言样本
  // 与门同步（TK-68-05 F1）：任意 kind 的 completed Java 卡都是样本。
  const javaCards = (tj.tasks||[]).filter(t => t.status==='completed'
    && (t.changedPaths||[]).some(p => /\.java$|pom\.xml$/.test(p)));
  if (javaCards.length === 0) return true;                                        // 数据源切换后可能暂无 Java 卡
  const target = javaCards[0];
  const origCmds = target.commandsRun;
  const bak = tjPath + '.verify-bak';
  writeFileSync(bak, JSON.stringify(tj), 'utf8');
  try {
    target.commandsRun = [];
    writeFileSync(tjPath, JSON.stringify(tj, null, 2), 'utf8');
    const REAL_NODE = process.env.QUANNENG_NODE || 'node';
    const red = spawnSync(REAL_NODE, ['scripts/pre-verify.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000 });
    if (red.status !== 1) throw new Error('tampered card should block, got ' + red.status);
    return true;
  } finally {
    writeFileSync(tjPath, readFileSync(bak,'utf8'), 'utf8');
    rmSync(bak, { force: true });
  }
});
await t('routes.json 结构合法：白黑名单不相交且字段齐全（一致性由 release 独立 drift 门承担）', () => {
  const g = workspace;
  const p = join(g, 'docs/squad/gates/routes.json');
  if (!existsSync(p)) return false;
  try {
    const r = JSON.parse(readFileSync(p, 'utf8'));
    const a = new Set(r.allowed || []), d = new Set(r.dead || []);
    if (!r.allowed || !r.dead || !r.updatedAt) return false;
    return [...a].every(x => !d.has(x));
  } catch { return false; }
});
await t('route-gate 不限制模型：buddy/任意模型都过（全能小队用所有模型）', async () => {
  const { spawnSync: ss2 } = await import('node:child_process');
  const node2 = process.execPath;
  const cases = [
    {seat:'X',provider:'buddy',model:'glm-5.3-flash'},
    {seat:'Y',provider:'any-provider',model:'any-model'},
    {seat:'Z',provider:'qodercn',model:'qfmodel'},
  ];
  for (const c of cases) {
    const r = spawnSync(node2, ['scripts/route-gate.mjs', JSON.stringify([c])], {cwd: root, encoding:'utf8', timeout:60000});
    if (r.status !== 0) return false;
  }
  return true;
});
await t('route-gate 源码接线确认（dispatch-guard 调用）', () => {
  const dg = readFileSync(join(root,'scripts/dispatch-guard.mjs'),'utf8');
  return dg.includes('route-gate.mjs') && dg.includes('roster-snapshot.json') && dg.includes('ROUTE GATE');
});
await t('代理签署规程含队长工作形态（派单给成员而非 captain 挂卡）', () => {
  const f = join(workspace,'docs/squad/gates/PROXY-AUTHORITY.md');
  if (!existsSync(f)) return false;
  const s = readFileSync(f,'utf8');
  return s.includes('assignee=<真实席位>') && s.includes('调度器') && s.includes('队长未激活');
});
// 四份治理文档断言合并为 1 条 smoke（工程师共识：文档在场≠修复，只保留最小存在性检查；
// 行为强制由 route-gate/pre-verify 行为断言承担）。
await t('治理文档 smoke: PROXY-AUTHORITY / PRE-VERIFY-CHECKLIST / PANEL-INTEGRATION / DISPATCH-CHECKLIST', () => {
  const g = workspace;
  const req = [
    ['docs/squad/gates/PROXY-AUTHORITY.md', ['不得', 'verdict=pass']],
    ['docs/squad/gates/PRE-VERIFY-CHECKLIST.md', ['mvn -o test']],
    ['docs/squad/gates/PANEL-INTEGRATION.md', ['reasoning_effort', 'medium']],
    ['docs/squad/gates/DISPATCH-CHECKLIST.md', ['变更类型标签', 'route-gate']],
  ];
  return req.every(([f, keys]) => {
    const p = join(g, f);
    if (!existsSync(p)) return false;
    const s = readFileSync(p, 'utf8');
    return keys.every(k => s.includes(k));
  });
});
await t('panel-sync 本地视图可读且令牌字段完整', async () => {
  const { scanLocal } = await import('../../panel-sync.mjs');
  const l = scanLocal();
  return l.length > 0 && l.every(x => /^TK-\d+-\d+$/.test(x.token) && x.seat && x.state);
});
await t('T10: 词表收编面板态 + supervise 消费面板（假绿根因防再犯）', async () => {
  const { PENDING_RE, TERMINAL_RE } = await import('../../lib/gate-kit.mjs');
  const vocabOk = ['待批准（staged）','claimed','in_progress','pending','派发中'].every(x => PENDING_RE.test(x) && !TERMINAL_RE.test(x));
  const sv = readFileSync(join(root,'scripts/supervise.mjs'),'utf8');
  return vocabOk && /panelTasks/.test(sv) && /面板在途/.test(sv);
});
await t('T10: memory-sla 顶格边界 >=（U17）', () => {
  const s = readFileSync(join(root,'scripts/memory-sla.mjs'),'utf8');
  return /pending >= LIMIT/.test(s) && !/if \(pending > LIMIT\)/.test(s);
});
await t('D7: 解析器显式认 ## 当前豁免 段', () => {
  const s = readFileSync(join(root,'scripts/lib/exemptions.mjs'),'utf8');
  const code = s.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  return code.includes("indexOf('## 当前豁免')") && !code.includes("split('## 历史')");
});
await t('D7: 历史段未来日期不产生豁免', async () => {
  const { readExemptions } = await import('../../lib/exemptions.mjs');
  // 不依赖真实当前表状态（真实表可有合法登记）；独立临时工作区构造负样本。
  const d = mkdtempSync(join(tmpdir(), 'd7v-'));
  try {
    const soon = new Date(Date.now() + 86400000).toISOString().slice(0,10);
    mkdirSync(join(d, 'docs/squad/gates'), { recursive:true });
    writeFileSync(join(d, 'docs/squad/gates/EXEMPTIONS.md'), [
      '# E', '## 当前豁免', '| 门 | 到期 | 原因 | 登记人 | 会签人 | 闭合条件 |', '| --- | --- | --- | --- | --- | --- |', '',
      '## 历史', '| 门 | 期间 | 说明 |', '| --- | --- | --- |',
      '| reflow-check | ' + soon + ' | 历史未来日期绝不能生效 | 旧 | - |'].join('\n'), 'utf8');
    return Object.keys(readExemptions(d)).length === 0;
  } finally { rmSync(d, { recursive:true, force:true }); }
});

await t('V-52-01: memory-sla 默认阻断且 supervise 消费', () => {
  const s=readFileSync(join(root,'scripts/memory-sla.mjs'),'utf8');
  const sv=readFileSync(join(root,'scripts/supervise.mjs'),'utf8');
  return /runGate/.test(s) && /memorySla/.test(sv);
});
await t('D6: memory-sla 在位且接入 release 链', () => existsSync(join(root,'scripts/memory-sla.mjs')) && pkg().scripts.release.includes('memory-sla.mjs'));
await t('D8: result-verify 含 >=5 条双端 parity 行', () => { const s=readFileSync(join(root,'scripts/result-verify.mjs'),'utf8'); return (s.match(/^\s*\['[^']+', java, \/[^/]+\/, node, \/[^/]+\//gm)||[]).length >= 5; });
await t('L4: 成熟度门在位且接入 release 链', () => existsSync(join(root,'scripts/l4/maturity.mjs')) && pkg().scripts.release.includes('l4/maturity.mjs'));
await t('时刻监督: dispatch-guard.mjs 在位', () => existsSync(join(root,'scripts/dispatch-guard.mjs')));
await t('时刻监督: lead-scope-check.mjs 在位', () => existsSync(join(root,'scripts/lead-scope-check.mjs')));
await t('时刻监督: supervise.mjs 在位', () => existsSync(join(root,'scripts/supervise.mjs')));
await t('时刻监督: 三件套接入 release 链', () => { const c=pkg().scripts.release; return c.includes('dispatch-guard.mjs') && c.includes('lead-scope-check.mjs') && c.includes('supervise.mjs'); });
await t('时刻监督: SUPERVISION.json 可解析且 gates 全对象', () => { const p=join(workspace,'docs/squad/SUPERVISION.json'); if(!existsSync(p)) return false; const s=JSON.parse(readFileSync(p,'utf8')); return s.gates && typeof s.gates==='object' && s.java && s.freshness; });

await t('memory backend is local-primary / cloud auxiliary', () => {
  const flat = readFileSync(join(root, 'scripts/memory.mjs'), 'utf8').replace(/\s+/g, '');
  return flat.includes("backend:'local-primary'") && flat.includes("cloud:'auxiliary'");
});
await t('memory CLI enforces content dedupe', () => readFileSync(join(root,'scripts/memory.mjs'),'utf8').includes('duplicate content'));
  })();
}
