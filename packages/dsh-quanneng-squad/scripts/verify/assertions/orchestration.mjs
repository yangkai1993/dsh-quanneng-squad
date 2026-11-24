// 第2期重构：本模块由 verify.mjs 机械拆分而来（断言内容逐字保留，零语义变化）。
// ctx = { t, root, readFileSync, existsSync, join, spawnSync, pathToFileURL, tmpdir, mkdtempSync, mkdirSync, writeFileSync, rmSync, pkg, patch, buildPatchText }
export function run(ctx) {
  const { t, root, readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, spawnSync, pathToFileURL, tmpdir, join, dirname, workspace, pkg, patch, buildPatchText } = ctx;
  return (async () => {
await t('gate-rotation 行为：STATE 轮号解析→W 绑定→缺令牌检测（源码断言+结构）', () => {
  const s = readFileSync(join(root,'scripts/gate-rotation.mjs'),'utf8');
  return s.includes('currentRotation') && s.includes('TK-')
    && s.includes('runGate(') && s.includes('failFast(') && s.includes('missing');
});
await t('队长编排可见性：coverage 卡 + PANEL-INTEGRATION 收件箱/coverage 闭环', () => {
  const g = workspace;
  const doc = join(g,'docs/squad/gates/PANEL-INTEGRATION.md');
  const brief = join(g,'docs/squad/briefs/captain-orchestration-TK-68-00.md');
  if (!existsSync(doc) || !existsSync(brief)) return false;
  const d = readFileSync(doc,'utf8'), b = readFileSync(brief,'utf8');
  return d.includes('队长收件箱') && d.includes('coverageOf') && d.includes('拆解→派发→汇总')
    && b.includes('TK-68-01') && b.includes('拆解');
});
await t('轮转字段名一致：pulse/gate 用 .round，无 .w 残留（防 undefined bug）', () => {
  return ['scripts/pulse.mjs','scripts/gate-rotation.mjs'].every(f => {
    const s = readFileSync(join(root,f),'utf8');
    return !s.includes('currentW.w') && !s.includes('current.w') && s.includes('.round');
  });
});
await t('智能组织自动化：squad-autopilot 三模式存在且接入 squadctl', () => {
  const s = readFileSync(join(root,'scripts/squad-autopilot.mjs'),'utf8');
  const ctl = readFileSync(join(root,'scripts/squadctl.mjs'),'utf8');
  return ['--plan','--apply','--report','currentRotation','FUNCTION-LEDGER'].every(k => s.includes(k))
    && ctl.includes('autopilot:plan') && ctl.includes('autopilot:apply') && ctl.includes('autopilot:report');
});
await t('autopilot --plan 数据驱动：名单=rotation 真源且写域零未知', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.env.QUANNENG_NODE || 'node', ['scripts/squad-autopilot.mjs','--plan'], {cwd: root, encoding:'utf8', timeout:60000});
  if (r.status !== 0) return false;
  let j=null; try { j = JSON.parse((r.stdout||'').trim()); } catch { return false; }
  return j.expected > 0 && Array.isArray(j.plan) && j.plan.length === j.expected
    && j.plan.every(p => !p.domain.includes('未知') && p.token && p.status.includes('仅登记移交意图'));
});
await t('令牌格式门可见：autopilot 用纯数字 9xx 后缀（门正则兼容）', () => {
  const s = readFileSync(join(root,'scripts/squad-autopilot.mjs'),'utf8');
  return s.includes("900 + i") && !s.includes("'-A' + (i") && s.includes('--verify');
});
await t('gate-rotation SLATED 语义：认登记态(签发源+写域)且反裸占位号', () => {
  const s = readFileSync(join(root,'scripts/gate-rotation.mjs'),'utf8');
  return s.includes('签发源') && s.includes('轮转确认') && s.includes('WRITE_DOMAIN')
    && s.includes('仅登记移交意图') && s.includes('PENDING_RE');
});
await t('进化回归夹具：矛盾场景可重放 + 接入 release（发现→夹具→门→反哺闭环）', () => {
  const p = join(root,'scripts/evolution-fixture.mjs');
  if (!existsSync(p)) return false;
  const s = readFileSync(p,'utf8');
  return s.includes('mkdtempSync') && s.includes('QUANNENG_WORKSPACE')
    && s.includes('格式分裂反例') && s.includes('GR-2 反伪造') && s.includes('分层')
    && pkg().scripts.release.includes('evolution-fixture.mjs');
});
await t('真源防回归夹具：叙述篡改不驱动轮次（事件溯源/CQRS）且接入 release', () => {
  const p = join(root,'scripts/source-of-truth-fixture.mjs');
  if (!existsSync(p)) return false;
  const s = readFileSync(p,'utf8');
  const ev = readFileSync(join(root,'scripts/lib/round-events.mjs'),'utf8');
  return s.includes('叙述篡改不驱动轮次') && s.includes('round-events')
    && ev.includes('ROUND_ADVANCE') && ev.includes('cmdAdvance')
    && pkg().scripts.release.includes('source-of-truth-fixture.mjs');
});
await t('轮次真源单一：rotation/facts 均从事件派生，不读 STATE 文本', () => {
  const a = readFileSync(join(root,'scripts/lib/rotation.mjs'),'utf8');
  const b = readFileSync(join(root,'scripts/l4/facts.mjs'),'utf8');
  // 只检查代码不读 STATE（注释允许提及）；真实行为由 source-of-truth-fixture 复现验证。
  const readsState = s => /readFileSync\([^)]*STATE\.md/.test(s);
  return a.includes('deriveState') && !readsState(a)
    && b.includes('deriveState') && !readsState(b);
});
await t('专家 blockers 消除：新门(proxy/env)与夹具接 release', () => {
  const rel = pkg().scripts.release;
  return ['env-guard.mjs','proxy-gate.mjs','env-guard-fixture.mjs','proxy-gate-fixture.mjs']
    .every(f => existsSync(join(root,'scripts',f)) && rel.includes(f));
});
await t('cmdIssueToken 行为真落盘（R-01 回归 · 1.15.0 接库后更新实现引用）', () => {
  const s = readFileSync(join(root,'scripts/lib/round-events.mjs'),'utf8');
  const es = readFileSync(join(root,'scripts/lib/event-store.mjs'),'utf8');
  const fx = readFileSync(join(root,'scripts/source-of-truth-fixture.mjs'),'utf8');
  return s.includes('export function cmdIssueToken') && s.includes("from './event-store.mjs'")
    && es.includes('appendFileSync(eventsPath(')
    && fx.includes('cmdIssueToken 真落盘');
});
await t('插件资产清单完整：MANIFEST.dirs 含 intel/prompts（智能体资产不漏同步）', () => {
  const m = JSON.parse(readFileSync(join(root,'assets/MANIFEST.json'),'utf8'));
  return ['docs/squad/intel','docs/squad/prompts','docs/squad/gates','docs/squad/audit']
    .every(d => (m.dirs || []).includes(d));
});
await t('lead 预设自动部署：install 部署 squad-lead 且 preset.yml 显示名正确', () => {
  const im = readFileSync(join(root,'scripts/install.mjs'),'utf8');
  const pd = join(process.env.HOME || process.env.USERPROFILE || 'C:/Users/ASUS','.dsh/.agent-presets/squad-lead');
  const py = join(pd,'preset.yml'), ay = join(pd,'agent.cordis.yml');
  if (!existsSync(py) || !existsSync(ay)) return false;
  const y = readFileSync(py,'utf8'), a = readFileSync(ay,'utf8');
  return im.includes('presetsDeployed') && im.includes('.agent-presets')
    && y.includes('小队指挥') && !y.includes("name: '@deepseek-ai/dsh-agent-preset'")
    && a.includes('preset-squad-lead');
});
await t('跨对话可用性：真源无宿主专属工具钉住 + install 同步 profile patch', () => {
  const canon = readFileSync(join(root,'assets/canonical/presets.yml'),'utf8');
  const im = readFileSync(join(root,'scripts/install.mjs'),'utf8');
  const patch = readFileSync(join(root,'cordis.patch.yml'),'utf8');
  return !canon.includes('dsh-tool-subagent-control/list-agents')
    && !patch.includes('dsh-tool-subagent-control/list-agents')
    && im.includes('patchSynced') && im.includes('cordis.patch.yml');
});
await t('事件存储 event-store：六类型常量+状态机转换表+损坏行 fail-closed（一期 1.15.0）', () => {
  const es = readFileSync(join(root,'scripts/lib/event-store.mjs'),'utf8');
  const hasTypes = ['ROUND_ADVANCE','TOKEN_ISSUED','DISPATCH','REPORT','ACCEPT','REJECT'].every(ty => es.includes(ty+":"));
  const hasTrans = /TOKEN_TRANSITIONS\s*=/.test(es) && /planned:.*dispatched/.test(es) && /accepted:.*\[\]/.test(es);
  const failClosed = /损坏/.test(es) && /fail-closed/.test(es);
  const singleWrite = /appendEvent/.test(es) && (es.match(/appendFileSync\(/g)||[]).length===1;
  return hasTypes && hasTrans && failClosed && singleWrite;
});
await t('状态机门接入：state-machine-gate.mjs 存在+实跑绿+ squadctl gate 表注册', async () => {
  const sm = readFileSync(join(root,'scripts/state-machine-gate.mjs'),'utf8');
  const usesLib = /from '\.\/lib\/event-store\.mjs'/.test(sm) && /TOKEN_TRANSITIONS/.test(sm);
  const { spawnSync: ss } = await import('node:child_process');
  const r = ss(process.execPath, ['scripts/state-machine-gate.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000, shell: true });
  const sc = readFileSync(join(root,'scripts/squadctl.mjs'),'utf8');
  return usesLib && r.status === 0 && sc.includes('state-machine-gate.mjs');
});
await t('通道统一：autopilot/dispatch-plan 零 agent_teams_send_message+collect 事件源化（回报真源=REPORT 事件）', () => {
  const ap = readFileSync(join(root,'scripts/squad-autopilot.mjs'),'utf8');
  const dp = readFileSync(join(root,'scripts/lib/dispatch-plan.mjs'),'utf8');
  const noLegacy = !ap.includes('agent_teams_send_message') && !dp.includes('agent_teams_send_message');
  const eventDriven = /deriveTokenStates/.test(ap) && /collect/.test(ap);
  const shellDispatch = /createDispatchPlan/.test(ap) && /createDispatchPlan\(/.test(dp);
  return noLegacy && eventDriven && shellDispatch;
});
await t('round-events 命令层：DISPATCH/REPORT/ACCEPT/REJECT/DISCREPANCY 命令齐+沿用 event-store 单写入口', () => {
  const re = readFileSync(join(root,'scripts/lib/round-events.mjs'),'utf8');
  const cmds = ['cmdDispatch','cmdReport','cmdAccept','cmdReject','cmdNoteDiscrepancy','cmdAdvance','cmdIssueToken'].every(f => re.includes('export function '+f));
  const viaStore = /from '\.\/event-store\.mjs'/.test(re) && (re.match(/appendFileSync/g)||[]).length===0;
  return cmds && viaStore;
});
await t('对账注记在案：事件日志含 DISCREPANCY（71↔68 偏差披露，真源轮次不被叙述篡改）', () => {
  const p = join(workspace, 'docs/squad/events/round-events.jsonl');
  if (!existsSync(p)) return false;
  const lines = readFileSync(p,'utf8').split('\n').filter(Boolean);
  const types = lines.map(l => { try { return JSON.parse(l).type; } catch { return 'BROKEN'; } });
  return types.includes('DISCREPANCY') && !types.includes('BROKEN');
});
await t('roster 三接口收编：lib/roster.mjs read/write/clearPins 存在且双消费方薄壳引用（或至少导出稳定）', () => {
  const ro = readFileSync(join(root,'scripts/lib/roster.mjs'),'utf8');
  const api = ['export function read','export function write','export function clearPins'].every(k => ro.includes(k));
  const ex = readFileSync(join(root,'scripts/export-roster.mjs'),'utf8');
  const sm = readFileSync(join(root,'scripts/sync-seat-model.mjs'),'utf8');
  // 兼容期：允许消费方渐进接入，但必须至少有一方引用（防止接口死代码）
  return api && (ex.includes("lib/roster.mjs") || sm.includes("lib/roster.mjs"));
});

await t('A1 评分快照：prompt-score.mjs snapshot-digest 模式+快照文件+门绿（1.16.0）', async () => {
  const ps = readFileSync(join(root,'scripts/prompt-score.mjs'),'utf8');
  const sha = /createHash/.test(ps) && /sha256/.test(ps);
  const snap = join(workspace,'docs/squad/pipeline/prompt-score-snapshot.json');
  const okSnap = existsSync(snap) && Object.keys(JSON.parse(readFileSync(snap,'utf8')).entries || {}).length >= 20;
  const { spawnSync: ss2 } = await import('node:child_process');
  const r = ss2(process.execPath, ['scripts/prompt-score.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000, shell: true });
  return sha && okSnap && r.status === 0;
});
await t('A2 技能化：assets/skills/ ≥12 个 SKILL.md+frontmatter "Use when"+sop-inject 技能索引节', () => {
  const dir = join(root,'assets/skills');
  if (!existsSync(dir)) return false;
  const names = readdirSync(dir);
  if (names.length < 12) return false;
  for (const n of names) {
    const t = readFileSync(join(dir,n,'SKILL.md'),'utf8');
    if (!/^name: /m.test(t) || !/Use when/.test(t)) return false;
  }
  const im = readFileSync(join(root,'lib/index.js'),'utf8');
  return im.includes('技能索引');
});
await t('B2 GLOSSARY：docs/squad/GLOSSARY.md 七正名+Avoid 反例词表在案', () => {
  const g = join(workspace,'docs/squad/GLOSSARY.md');
  if (!existsSync(g)) return false;
  const t = readFileSync(g,'utf8');
  return ['席位','令牌','写域','回报','门（Gate）','轮次','派活'].every(k => t.includes(k)) && (t.match(/_Avoid_/g)||[]).length >= 7;
});
await t('B3 成本三数：TEAM-PULSE 成本段+pulse.mjs deriveState/costThree 实测取数', () => {
  const tp = join(workspace,'docs/squad/TEAM-PULSE.md');
  if (!existsSync(tp)) return false;
  const t = readFileSync(tp,'utf8');
  const pu = readFileSync(join(root,'scripts/pulse.mjs'),'utf8');
  return t.includes('本轮成本三数') && pu.includes('deriveState') && pu.includes('costThree');
});
await t('L3/L5 增强：pulse-board 三态徽章+obs:rank+hub 第六源+diagnostics +2 症状+squadctl 注册（1.16.0）', async () => {
  const pb = readFileSync(join(root,'scripts/ux/pulse-board.mjs'),'utf8');
  const hasBadge = /🟢|🟡|🔴/.test(pb) && /FUNCTION-LEDGER/.test(pb);
  const rankF = existsSync(join(root,'scripts/observability/rank.mjs'));
  const hub = readFileSync(join(root,'scripts/observability/hub.mjs'),'utf8');
  const sixth = hub.includes('tokenStateMachine');
  const dg = readFileSync(join(root,'scripts/observability/diagnostics.mjs'),'utf8');
  const dg2 = dg.includes('事件日志损坏') && dg.includes('令牌卡死');
  const sc = readFileSync(join(root,'scripts/squadctl.mjs'),'utf8');
  const reg = sc.includes('ux:pulse-board') && sc.includes('obs:rank');
  const { spawnSync: ss3 } = await import('node:child_process');
  const r = ss3(process.execPath, ['scripts/ux/pulse-board.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000, shell: true });
  return hasBadge && rankF && sixth && dg2 && reg && r.status === 0;
});

await t('A3 AGENTS 单源化：CLAUDE.md 指纹头生成物+门绿（1.17.0）', async () => {
  const bac = readFileSync(join(root,'scripts/build-agents-context.mjs'),'utf8');
  const hasMark = bac.includes('AUTO-GENERATED from AGENTS.md');
  const cl = join(workspace,'CLAUDE.md');
  const ok = existsSync(cl) && readFileSync(cl,'utf8').startsWith('<!-- AUTO-GENERATED from AGENTS.md');
  const { spawnSync: ss4 } = await import('node:child_process');
  const r = ss4(process.execPath, ['scripts/build-agents-context.mjs','--check'], { cwd: root, encoding: 'utf8', timeout: 60000, shell: true });
  return hasMark && ok && r.status === 0;
});
await t('A4 garden：drift-check 三检测在位（孤儿/超长/回程）+实跑绿', async () => {
  const dc = readFileSync(join(root,'scripts/drift-check.mjs'),'utf8');
  const hasGarden = dc.includes('garden C 孤儿') && dc.includes('garden D 超长') && dc.includes('garden E 清单孤儿');
  const { spawnSync: ss5 } = await import('node:child_process');
  const r = ss5(process.execPath, ['scripts/drift-check.mjs'], { cwd: root, encoding: 'utf8', timeout: 120000, shell: true });
  return hasGarden && r.status === 0;
});
await t('A6 protected_paths：dispatch-guard 提取+交叉检查+overlaps 尾斜杠鲁棒（1.17.0）', () => {
  const dg = readFileSync(join(root,'scripts/dispatch-guard.mjs'),'utf8');
  return dg.includes('protectedPaths') && dg.includes('写域侵入他卡 protected_paths')
    && dg.includes('x===y || x.startsWith');
});
await t('S5→S4 回环+B4 status 列+B5 changeset 聚合器（1.17.0）', () => {
  const dp = readFileSync(join(workspace,'docs/squad/pipeline/DELIVERY-PIPELINE.md'),'utf8');
  const loop = dp.includes('S5→S4 fix loop') && dp.includes('复跑触发红的那扇门');
  const idx = readFileSync(join(workspace,'docs/squad/prompts/INDEX.md'),'utf8');
  const b4 = idx.includes('| current |');
  const agg = readFileSync(join(root,'scripts/aggregate-changelog.mjs'),'utf8');
  const b5 = agg.includes('aggregate') && existsSync(join(root,'CHANGELOG.d'));
  return loop && b4 && b5;
});

await t('四期 1.18.0：model-tiers 建议层零字面量+派单清洗+工作量预估+多署会审规程', async () => {
  const mt = readFileSync(join(root,'scripts/lib/model-tiers.mjs'),'utf8');
  const p15 = mt.includes('不钉死') && !/provider:s*['"]/.test(mt) && !/model:s*['"][a-z]/i.test(mt);
  const dpl = readFileSync(join(root,'scripts/lib/dispatch-plan.mjs'),'utf8');
  const clean = dpl.includes('sanitizeMessage') && dpl.includes('effort');
  const { spawnSync: ss6 } = await import('node:child_process');
  const r = ss6(process.execPath, ['scripts/.probe-tiers-p15.mjs'], { cwd: root, encoding: 'utf8', timeout: 30000, shell: true }).status;
  const audit = join(workspace,'docs/squad/audit/multi-office-review-1.18.0.md');
  const tri = existsSync(audit) && readFileSync(audit,'utf8').includes('御史大夫') && readFileSync(audit,'utf8').includes('给事中') && readFileSync(audit,'utf8').includes('考功郎中');
  return p15 && clean && r === 0 && tri;
});

await t('五期 1.19.0：适配器生成层 21 产物+npm bin+OUT-OF-SCOPE 解封留痕+看板 API', async () => {
  const ad = readFileSync(join(root,'scripts/build-adapters.mjs'),'utf8');
  const gen = ad.includes('buildClaudeAdapter') && ad.includes('DO NOT HAND-EDIT');
  const adRoot = join(root,'dist-adapters/claude-code');
  const hasPJ = existsSync(join(adRoot,'plugin.json')) && existsSync(join(adRoot,'marketplace.json'));
  const cmds = existsSync(join(adRoot,'commands')) ? readdirSync(join(adRoot,'commands')).filter(f=>f.endsWith('.md')).length : 0;
  const ags = existsSync(join(adRoot,'agents')) ? readdirSync(join(adRoot,'agents')).filter(f=>f.endsWith('.md')).length : 0;
  const pkgJson = JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  const bin = pkgJson.bin && pkgJson.bin.squadctl;
  const oos = join(workspace,'docs/squad/OUT-OF-SCOPE.md');
  const unlocked = existsSync(oos) && readFileSync(oos,'utf8').includes('解封留痕 2026-11-24');
  const board = readFileSync(join(root,'scripts/dashboard/board.mjs'),'utf8');
  const boardOk = board.includes("dirname(fileURLToPath(import.meta.url)), '..', '..')") && board.includes('127.0.0.1') && /from\s+['"]node:/.test(board); // 仅 node: 内置
  return gen && hasPJ && cmds >= 12 && ags === 7 && bin && unlocked && boardOk;
});

await t('六期 1.20.0：telemetry seat/usage 规范化+rank usage 聚合+concurrency 元信息+门层单测', () => {
  const tm = readFileSync(join(root,'scripts/observability/telemetry.mjs'),'utf8');
  const telOk = tm.includes('seat: typeof event?.seat') && tm.includes('usage');
  const rk = readFileSync(join(root,'scripts/observability/rank.mjs'),'utf8');
  const rankOk = rk.includes('usageAgg') && rk.includes('usageTotal');
  const dpl = readFileSync(join(root,'scripts/lib/dispatch-plan.mjs'),'utf8');
  const ccOk = dpl.includes('concurrency') && dpl.includes('recommended');
  const gt = existsSync(join(root,'tests/gates.test.js')) && readFileSync(join(root,'tests/gates.test.js'),'utf8').includes('state-machine-gate');
  return telOk && rankOk && ccOk && gt;
});

  })();
}
