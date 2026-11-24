#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// 全能小队统一 CLI（组件化收尾）：21 个脚本 / 34 个 npm scripts 收口到一个入口。
// 依据 SRP/ISP：本文件只做「子命令 → 既有脚本」映射，不重复实现任何门逻辑（DRY）。
const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const NODE = process.execPath;

const MAP = {
  'doctor':               'scripts/doctor.mjs',
  'ux:quickstart':        'scripts/ux/quickstart.mjs',
  'ux:status':            'scripts/ux/status.mjs',
  'ux:light-mode':        'scripts/ux/light-mode.mjs',
  'ux:pulse-board':       'scripts/ux/pulse-board.mjs',
  'ux:board':             'scripts/dashboard/board.mjs',  // 零依赖 Web 看板（长驻服务）
  'obs:hub':              'scripts/observability/hub.mjs',
  'obs:telemetry':        'scripts/observability/telemetry.mjs',
  'obs:diagnostics':      'scripts/observability/diagnostics.mjs',
  'obs:rank':             'scripts/observability/rank.mjs',
  'upgrade':              'scripts/delivery/upgrade.mjs',
  'rollback':             'scripts/delivery/rollback.mjs',
  'gate':                 'scripts/drift-check.mjs',
  'gate:scope':           'scripts/dispatch-guard.mjs',
  'gate:lead':            'scripts/lead-scope-check.mjs',
  'gate:seats':           'scripts/seat-utilization.mjs',
  'gate:roster':          'scripts/audit-roster.mjs',
  'gate:reflow':          'scripts/reflow-check.mjs',
  'gate:order':           'scripts/stage-order.mjs',
  'gate:result':          'scripts/result-verify.mjs',
  'gate:tokens':          'scripts/state-machine-gate.mjs',
  'gate:memory':          'scripts/memory-sla.mjs',
  'supervise':            'scripts/supervise.mjs',
  'l4:maturity':          'scripts/l4/maturity.mjs',
  'l4:run':               'scripts/l4/run.mjs',
  'l4:ledger':            'scripts/l4/sync-ledger.mjs',
  'l4:fixture':           'scripts/l4/toy-fixture.mjs',
  'memory:status':        ['scripts/memory.mjs','status'],
  'memory:replay':        ['scripts/memory.mjs','replay'],
  'memory:verify':        ['scripts/memory.mjs','verify'],
  'memory:export':        ['scripts/memory.mjs','export'],
  'verify':               'scripts/verify.mjs',
  'autopilot:plan':       ['scripts/squad-autopilot.mjs','--plan'],
  'autopilot:apply':      ['scripts/squad-autopilot.mjs','--apply'],
  'autopilot:report':     ['scripts/squad-autopilot.mjs','--report'],
  'autopilot:dispatch':   ['scripts/squad-autopilot.mjs','--dispatch'],
  'autopilot:collect':    ['scripts/squad-autopilot.mjs','--collect'],
  'roster':               null, // 内置：轮次名册推荐（不重复实现门逻辑）
  'release':              null, // 交给 npm run release
};

const args = process.argv.slice(2);
const cmd = args[0];
if (!cmd || cmd === 'help' || cmd === '--help') {
  // 第3期 v3：help 按域分组输出（物理零移动，域=用户视角层级）
  const domains = {
    '交付运维(delivery)': ['doctor','upgrade','rollback','pack','pack:check'],
    '验证(verify)': ['verify','gate','gate:scope','gate:lead','gate:seats','gate:roster','gate:reflow','gate:order','gate:result','gate:tokens','gate:memory'],
    '编排(orchestration)': ['supervise','autopilot:plan','autopilot:apply','autopilot:report','autopilot:dispatch','autopilot:collect','roster'],
    '成熟度(L4)': ['l4:maturity','l4:run','l4:ledger','l4:fixture'],
    '记忆(memory)': ['memory:status','memory:replay','memory:verify','memory:export'],
    '底层(release)': ['release']
  };
  const grouped = Object.entries(domains).map(([d, cmds]) => d + ':\n  ' + cmds.join('\n  ')).join('\n');
  console.log(JSON.stringify({ usage:'node scripts/squadctl.mjs <command> [args]', domains: Object.keys(domains), commands:Object.keys(MAP) }, null, 2));
  process.exit(0);
}
if (cmd === 'roster') {
  const { readFileSync, existsSync, readdirSync } = await import('node:fs');
  const W = process.env.QUANNENG_WORKSPACE || join(PKG, '..', '..');
  const rp = join(W, 'docs/squad/ROSTER-16.md');
  const bd = join(W, 'docs/squad/briefs');
  let max = 0;
  if (existsSync(bd)) for (const f of readdirSync(bd)) { const m=f.match(/round-(\d+)/); if(m) max=Math.max(max,Number(m[1])); }
  const t = existsSync(rp) ? readFileSync(rp,'utf8') : '';
  const { currentRotation } = await import('./lib/rotation.mjs');
  const rot = currentRotation(W);
  const rows = rot.rows.map((r, i) => ({ round: r.round, stage: (t.match(new RegExp('\\|\\s*' + r.round + '\\s*\\|([^|]*)\\|')) || [])[1]?.trim() || '', seats: r.seats }));
  const current = rot.current ? { round: rot.current.round, stage: rows[rot.wIdx]?.stage || '', seats: rot.current.seats } : null;
  const idx = rot.wIdx;
  const stated = null, statedIn = null;
  console.log(JSON.stringify({ maxRound:max, rotation:rows.map(r=>r.round),
    basis: rot.basis, statedIn, current,
    note:'按 ROSTER-16 §七轮次名册推荐当前上场 8 席；补派须受 C2 并发<=3 约束' }, null, 2));
  process.exit(0);
}
if (cmd === 'release') {
  const r = spawnSync('cmd.exe', ['/c','npm','run','release'], { cwd:PKG, encoding:'utf8', timeout:900000 });
  process.stdout.write(r.stdout||''); process.stderr.write(r.stderr||''); process.exit(r.status??1);
}
const target = MAP[cmd];
if (!target) {
  console.error('[squadctl] 未知子命令: ' + cmd + '；可用: ' + Object.keys(MAP).join(', '));
  process.exit(2);
}
const [file, ...extra] = Array.isArray(target) ? target : [target];
const r = spawnSync(NODE, [join(PKG,file), ...extra, ...args.slice(1)], { cwd:PKG, encoding:'utf8', timeout:900000 });
process.stdout.write(r.stdout||''); process.stderr.write(r.stderr||'');
process.exit(r.status??1);
