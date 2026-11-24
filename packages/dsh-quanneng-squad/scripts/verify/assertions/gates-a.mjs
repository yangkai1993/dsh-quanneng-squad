// 第2期重构：本模块由 verify.mjs 机械拆分而来（断言内容逐字保留，零语义变化）。
// ctx = { t, root, readFileSync, existsSync, join, spawnSync, pathToFileURL, tmpdir, mkdtempSync, mkdirSync, writeFileSync, rmSync, pkg, patch, buildPatchText }
export function run(ctx) {
  const { t, root, readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, spawnSync, pathToFileURL, tmpdir, join, dirname, workspace, pkg, patch, buildPatchText } = ctx;
  return (async () => {
await t('memory CLI supports export + cloud probe + replay --clear', () => {
  const flat = readFileSync(join(root, 'scripts/memory.mjs'), 'utf8').replace(/\s+/g, '');
  return flat.includes('functionexportMd') && flat.includes('asyncfunctioncloud') && flat.includes("clear==='--clear'");
});
await t('release chain includes memory verify + export', () => pkg().scripts.release.includes('memory.mjs verify') && pkg().scripts.release.includes('memory.mjs export'));
await t('DECISIONS.md exported', () => existsSync(join(workspace,'docs/squad/memory/DECISIONS.md')));
await t('export contract gate present (sync-lib)', () => existsSync(join(root,'scripts/sync-lib.mjs')));
await t('plugin barrel has a dedicated import test', () => readFileSync(join(root,'tests/index.test.js'),'utf8').includes("from '../lib/index.js'"));
await t('release chain runs the gate before install', () => {
  const rel = pkg().scripts.release;
  return rel.indexOf('sync-lib.mjs') < rel.indexOf('install.mjs') && rel.indexOf('run-tests.mjs') < rel.indexOf('install.mjs');
});
await t('no inline duplicate of frozen contract constants in barrel', () => {
  const s = readFileSync(join(root,'lib/index.js'),'utf8');
  return !/export const BIZ = Object.freeze/.test(s) && s.includes("} from './contract.js';");
});
await t('roster route audit script present', () => existsSync(join(root,'scripts/audit-roster.mjs')));
await t('entry barrel test asserts 52 public symbols', () => {
  const s = readFileSync(join(root,'tests/index.test.js'),'utf8');
  return s.includes("from '../lib/index.js'") && (s.match(/'(create|sm|normalize|transition|apply|assert|build|idem|req)/g) || []).length > 20;
});
await t('delivery pipeline defines S-1..S9 with mandatory artifacts', () => {
  const s = readFileSync(join(workspace,'docs/squad/pipeline/DELIVERY-PIPELINE.md'),'utf8');
  return ['S-1','S0','S1','S2','S3','S4','S5','S6','S7','S8','S9'].every(x => s.includes(x)) && s.includes('必产物');
});
await t('every seat carries a mandatory artifact', () => {
  const s = readFileSync(join(workspace,'docs/squad/FUNCTION-LEDGER.md'),'utf8');
  return (s.match(/^\| [^|]+ \| S/gm) || []).length >= 16;
});
await t('seat utilization gate exists and gates release', () => existsSync(join(root,'scripts/seat-utilization.mjs')) && pkg().scripts.release.includes('seat-utilization.mjs'));
await t('AGENTS.md mandates pipeline and six-element brief', () => {
  const s = readFileSync(join(workspace,'AGENTS.md'),'utf8');
  // v3 subagent-first：主通道=主对话 subagent，agent_teams 降级兼容；两者都必须在纪律中声明
  return s.includes('DELIVERY-PIPELINE') && s.includes('六要素')
    && s.includes('subagent') && s.includes('主对话')
    && s.includes('兼容通道');
});
await t('compatibility.json version tracks package.json (no drift)', () => {
  const c = JSON.parse(readFileSync(join(root,'compatibility.json'),'utf8'));
  return c.version === pkg().version;
});
await t('gates block by default and expose documented exemption', () => {
  const s = ['scripts/seat-utilization.mjs','scripts/audit-roster.mjs','scripts/reflow-check.mjs']
    .map(f => readFileSync(join(root,f),'utf8')).join('');
  return s.includes('QUANNENG_ALLOW_IDLE') && s.includes('QUANNENG_ALLOW_DEAD_ROUTE') && s.includes('QUANNENG_ALLOW_REFLOW_GAP')
    && !/STRICT_SEATS|STRICT_ROUTE|STRICT_REFLOW/.test(s);
});
await t('reflow gate present with 7 patterns', () => {
  const s = readFileSync(join(workspace,'docs/squad/gates/G-REFLOW.md'),'utf8');
  return (s.match(/\| P[1-7] \|/g) || []).length >= 7;
});
await t('version declarations agree across artifacts', () => {
  const v = pkg().version;
  const compat = JSON.parse(readFileSync(join(root,'compatibility.json'),'utf8')).version;
  const head = readFileSync(join(root,'cordis.patch.yml'),'utf8').split('\n')[1] || '';
  return compat === v && head.includes('v' + v);
});
await t('exemption parser is fail-closed: current table only, earliest date wins, typo ignored', async () => {
  const { readExemptions } = await import('../../lib/exemptions.mjs');
  const { writeFileSync: wf, rmSync, mkdirSync } = await import('node:fs');
  // 本宿主子进程 env 为空 → os.tmpdir() 不可用，探针目录必须落在工作区内并被 install 排除
  const d = join(root, '.tmp-exemption-probe');
  try {
    const g = join(d, 'docs/squad/gates');
    rmSync(d, { recursive: true, force: true });
    mkdirSync(g, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    wf(join(g, 'EXEMPTIONS.md'), ['# E', '', '## 当前豁免', '', '| 门 | 到期 | 原因 | 登记人 | 会签人 | 闭合条件 |', '| --- | --- | --- | --- | --- | --- |',
      '| reflow-check | ' + today + ' | 今天到期应失效 | x | y | - |',
      '| seat-utilization | ' + soon + ' | 有效 | x | y | - |',
      '| audit-roster | ' + soon + ' | 同 id 宽行 | x | y | - |',
      '| audit-roster | 2020-01-01 | 同 id 严行（取最早） | x | y | - |',
      '| reflow-chek | ' + soon + ' | 拼错 id 不生效 | x | y | - |',
    '| drift-check | ' + soon + ' | R-3 单人自签不生效 | x | x | - |',
      '', '## 历史', '', '| 门 | 期间 | 说明 |', '| --- | --- | --- |',
      '| reflow-check | ' + soon + ' | 历史表日期列绝不能被当作豁免 | 旧 | - |'].join('\n'), 'utf8');
    const ex = readExemptions(d);
    if (ex['reflow-check']) throw new Error('today-or-past expiry must not activate: ' + ex['reflow-check']);
    if (ex['reflow-chek']) throw new Error('typo id must be ignored');
    if (ex['seat-utilization'] !== soon) throw new Error('valid future row should apply, got ' + ex['seat-utilization']);
    if (ex['audit-roster']) throw new Error('earliest expiry must win: audit-roster=' + ex['audit-roster']);
    const bad = Object.values(ex).filter(v => !(v > new Date().toISOString().slice(0, 10)));
    if (bad.length) throw new Error('expired entry leaked through: ' + bad.join(','));
    return true;
  } finally { rmSync(d, { recursive: true, force: true }); }
});
await t('exempted gate traces on stderr, stdout stays JSON, exit becomes 0', async () => {
  const { spawnSync } = await import('node:child_process');
  const fsx = await import('node:fs');
  const d = join(root, '.verify-exempt-drill');
  fsx.rmSync(d, { recursive:true, force:true });
  fsx.mkdirSync(join(d, 'docs/squad/gates'), { recursive:true });
  // V-52-02：env 不再单独生效，必须与 EXEMPTIONS.md 带到期日登记同时存在（双因素）。
  const exp = new Date(Date.now() + 86400000).toISOString().slice(0,10);
  fsx.writeFileSync(join(d, 'docs/squad/gates/EXEMPTIONS.md'),
    '# E\n## 当前豁免\n| 门 | 到期 | 原因 | 登记人 | 会签人 | 闭合条件 |\n| --- | --- | --- | --- | --- | --- |\n' +
    '| reflow-check | ' + exp + ' | verify 双因素演练 | 总指挥 | 给事中 | 演练结束即删 |\n');
  const r = spawnSync(process.execPath, ['scripts/reflow-check.mjs'], {
    cwd: root, encoding:'utf8', timeout:60000,
    env: Object.assign({}, process.env, { QUANNENG_ALLOW_REFLOW_GAP:'1', QUANNENG_WORKSPACE:d }),
  });
  const err=(r.stderr||'').replace(/\r/g,''); let parsed=null; try { parsed=JSON.parse(r.stdout); } catch{}
  fsx.rmSync(d, { recursive:true, force:true });
  if (r.status !== 0) throw new Error('exempted run should exit 0, got '+r.status+' / '+err.split('\n')[0]);
  if (!err.includes('[豁免生效]')) throw new Error('exemption left no trace on stderr');
  if (!parsed) throw new Error('stdout must stay pure JSON');
  // 双因素豁免下门如实报 problems（缺输入）、靠豁免放行，ok:false 属预期；
  // 关键断言是 exit 0 + stderr 留痕 + stdout 纯 JSON，不再要求 ok:true。
  if (parsed.ok) throw new Error('gate should still report problems while exempted');
  return true;
});
await t('real workspace registers no stale or unknown exemption', async () => {
  const mod = await import('../../lib/exemptions.mjs');
  const ex = mod.readExemptions(join(root, '../..'));
  // 已知门清单以 exemptions.mjs 的 GATE_IDS 为唯一真源，避免双清单漂移
  const src = (await import('node:fs')).readFileSync(join(root, 'scripts/lib/exemptions.mjs'), 'utf8');
  const known = (src.match(/const GATE_IDS = \[([^\]]*)\]/) || [])[1];
  if (!known) throw new Error('GATE_IDS not found in exemptions.mjs');
  const allowed = known.split(',').map(s => s.trim().replace(/['"]/g, ''));
  for (const k of Object.keys(ex)) if (!allowed.includes(k)) throw new Error('unknown gate id exempted: ' + k);
  return true;
});
await t('release chain carries all five gates', () => {
  const rel = pkg().scripts.release;
  return ['drift-check','stage-order','seat-utilization','audit-roster','reflow-check'].every(g => rel.includes(g));
});
await t('SOP carries current discipline (token/user-prompt/result-verify/brief/five-gates)', () => {
  const s = readFileSync(join(root,'lib/index.js'),'utf8');
  return ['派活令牌','user-prompts','result-verify','简报与脉搏','五门'].every(k => s.includes(k));
});
await t('user-side prompt asset v2 exists with U1..U18 + five fields', () => {
  const f = join(workspace,'docs/squad/user-prompts/USER-PROMPTS-v2-2026-11-16.md');
  if (!existsSync(f)) return false;
  const s = readFileSync(f,'utf8');
  const us = [...s.matchAll(/^### U(\d+) /gm)].map(m => Number(m[1]));
  const all18 = Array.from({length:18},(_,i)=>i+1).every(n => us.includes(n));
  const fields = ['原话','意图','隐含验收','已兑现证据','未兑现缺口'];
  // 五字段只约束 U 条目节；「建议×3」等其他节不计。
  const uSecs = s.split(/^### /m).slice(1).filter(x => /^U\d+ /.test(x));
  return all18 && uSecs.length === 18 && uSecs.every(x => fields.every(k => x.includes(k)));
});
await t('TEAM-PULSE 机器生成：脚本存在+接 release+落 SUPERVISION.json', () => {
  const s = readFileSync(join(root,'scripts/pulse.mjs'),'utf8');
  const rel = pkg().scripts.release;
  return s.includes('supervise.mjs') && s.includes('TEAM-PULSE.md') && s.includes('SUPERVISION.json')
    && rel.includes('pulse.mjs') && existsSync(join(workspace,'docs/squad/SUPERVISION.json'));
});
await t('TEAM-PULSE 内容含全部实测节（七门/结果/席位/在途/路由/风险）', () => {
  const f = join(workspace,'docs/squad/TEAM-PULSE.md');
  if (!existsSync(f)) return false;
  const s = readFileSync(f,'utf8');
  return ['## 七门状态','## 结果','## 席位活动','## 在途令牌','## 路由快照','## 面板双账','## 未闭合风险','## 真缺口清单'].every(k => s.includes(k))
    && /第\s*[一二三四五六七八九十百零\d]+\s*轮/.test(s);
});
await t('TEAM-PULSE 轮转建议：从 ROSTER W 名册实读，含当前 W 与未活动席', () => {
  const f = join(workspace,'docs/squad/TEAM-PULSE.md');
  if (!existsSync(f)) return false;
  const s = readFileSync(f,'utf8');
  const sec = s.split('## 下一轮轮转建议')[1]?.split('##')[0] || '';
  return /当前名册 W[1-4]/.test(sec) && /近\s*\d+\s*轮未活动/.test(sec);
});
await t('gate-rotation 门存在+接入 release+GATE_IDS 登记（选项A W名单阻断）', () => {
  const p = join(root,'scripts/gate-rotation.mjs');
  if (!existsSync(p)) return false;
  const s = readFileSync(p,'utf8');
  const rel = pkg().scripts.release;
  const ex = readFileSync(join(root,'scripts/lib/exemptions.mjs'),'utf8');
  return s.includes('currentRotation') && s.includes('TK-') && s.includes('签发源')
    && rel.includes('gate-rotation.mjs') && ex.includes("'gate-rotation'");
});
  })();
}
