import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { syncSeatModels } from './sync-seat-model.mjs';
import { readDefaultModel } from './lib/config-adapter.mjs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { W, cn2num, maxBriefRound, runGate, failFast , TERMINAL_RE, PENDING_RE} from './lib/gate-kit.mjs';
// 派活前置门（P10）：同轮在途任务写域结构化且互斥；成员不得侵入指挥专属域。
// 依赖 gate-kit：W/cn2num/maxBriefRound/runGate 由共享组件提供（DRY/SRP/ISP）。
const DSP = join(W, 'docs/squad/dispatch');
const NODE = process.execPath;
const PKGDIR = join(W, 'packages/dsh-quanneng-squad');
const problems = [];
const norm = p => String(p).trim().replace(/\\/g,'/').replace(/^\.\//,'').replace(/\s*#.*$/,'').replace(/\|$/,'').trim();
const overlaps = (a,b) => { const x=a.replace(/\/+$/,''), y=b.replace(/\/+$/,''); return x===y || x.startsWith(y+'/') || y.startsWith(x+'/'); };
const maxRound = maxBriefRound(W);
const byToken = new Map();
if (existsSync(DSP)) for (const f of readdirSync(DSP)) {
  if (!f.endsWith('.md')) continue;
  const seat = f.replace('.md','');
  const t = readFileSync(join(DSP,f),'utf8');
  for (const sec of t.split(/\n(?=## )/)) {
    const rm = sec.match(/第\s*([0-9一二三四五六七八九十]+)\s*轮/);
    const round = rm ? cn2num(rm[1]) : NaN;
    if (Number.isNaN(round) || round < maxRound - 1) continue;
    const tm = sec.match(/\|\s*令牌\s*\|\s*(TK-\d+-\d+)/);
    if (!tm) continue;
    byToken.set(tm[1], { seat, tok:tm[1], round, sec });
  }
}
const inFlight = [];
for (const {seat,tok,round,sec} of byToken.values()) {
  const sm = sec.match(/\|\s*状态\s*\|([^\n]*)/);
  if (!sm || !/在途|running|重投/.test(sm[1])) continue;
  const TERMINAL = TERMINAL_RE;   // R-2：真源 gate-kit（原词表缺 非投递/过程记录/仅登记移交意图）
  if (TERMINAL.test(sm[1])) continue;
  const wm = sec.match(/\|\s*写域\s*\|([^\n]*)/);
  if (!wm || /见任务书|严格互斥|待定|过程记录|^\s*$/.test(wm[1])) {
    problems.push('派活写域未结构化 '+seat+' '+tok+'：须逐条列出文件/目录路径'); continue;
  }
  const paths = wm[1].split(/[,，;；]/).map(norm).filter(Boolean);
  if (!paths.length) { problems.push('派活写域为空 '+seat+' '+tok); continue; }
  // A6（1.17.0）：protected_paths=卡上声明禁改文件（防改测试凑绿）；验收三元组的机器护栏。
  const ppm = sec.match(/\|\s*protected_paths\s*\|([^\n]*)/);
  const protectedPaths = ppm ? ppm[1].split(/[,，;；]/).map(norm).filter(Boolean) : [];
  inFlight.push({seat,tok,round,paths,protectedPaths});
}
for (let i=0;i<inFlight.length;i++) for (let j=i+1;j<inFlight.length;j++) {
  const A=inFlight[i],B=inFlight[j];
  for (const pa of A.paths) for (const pb of B.paths)
    if (overlaps(pa,pb)) problems.push('写域重叠 '+A.tok+'('+A.seat+') 与 '+B.tok+'('+B.seat+')：'+pa+' ∩ '+pb);
}
// A6：本卡写域触碰他卡 protected_paths=红（防改测试凑绿 wshobson case.json 背书）
for (let i=0;i<inFlight.length;i++) for (let j=0;j<inFlight.length;j++) {
  if (i===j) continue;
  for (const p of inFlight[i].paths) for (const q of inFlight[j].protectedPaths||[])
    if (overlaps(p,q)) problems.push('写域侵入他卡 protected_paths '+inFlight[i].tok+'('+inFlight[i].seat+')：'+p+' ∩ 禁改 '+q+'（属 '+inFlight[j].tok+'）');
}
const LEAD_ONLY=['docs/squad/gates/','docs/squad/STATE.md','AGENTS.md'];
for (const x of inFlight) for (const p of x.paths)
  if (LEAD_ONLY.some(l=>norm(l).startsWith(norm(p))||norm(p).startsWith(norm(l))))
    problems.push('成员写域侵入指挥专属域 '+x.tok+'：'+p);
// ROUTE GATE（P15 不锁死模型）：派单路由以 profile 根 agent-default-model 的当前值为准。
// 席位快照（roster-snapshot.json）只提供席位名册，不再钉死创建时的旧 model——
// 否则用户换模型后，派单仍走快照里的旧路由（D-019R 席位快照 + 本轮「锁死模型」实测根因）。
function currentProfileRoute() {
  const dm = readDefaultModel();   // 统一适配层：自适应 profile 位置与配置形态
  return dm ? { provider: dm.provider, model: dm.model } : null;
}
try {
  // P15 席位跟随主模型：派单时清空席位 model pin（无 pin = 席位会话跟随宿主当前默认模型）。
  try { syncSeatModels(); } catch (e) { /* 软失败：不影响派单主流程 */ }
  const snapPath = join(W, 'packages/dsh-quanneng-squad/assets/roster-snapshot.json');   // W=仓库根
  if (existsSync(snapPath) && inFlight.length > 0) {
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
    const bySeat = new Map((snap.seats || []).map(s => [s.seat, s]));
    const current = currentProfileRoute();   // P15：单一动态真源
    const payload = inFlight.map(x => {
      const s = bySeat.get(x.seat) || bySeat.get(x.seat + '@v21') || {};
      // profile 当前模型优先；读不到时才回退快照（兼容无 profile 的 CI 夹具）
      const provider = current ? current.provider : (s.provider || '');
      const model = current ? current.model : (s.model || '').replace(/^our-free-model\//, '');
      return { seat: x.seat, provider, model };
    });
    const rg = spawnSync(NODE, ['scripts/route-gate.mjs', JSON.stringify(payload)], { cwd: PKGDIR, encoding: 'utf8', timeout: 60000 });
    if (rg.status !== 0) {
      let rj = null; try { rj = JSON.parse(rg.stdout); } catch {}
      for (const p of (rj && rj.problems || [])) problems.push('route-gate: ' + p);
    }
  }
} catch (e) { problems.push('route-gate 调用失败（fail-closed）: ' + e.message); }
const exitCode = runGate({name:'dispatch-guard',varName:'QUANNENG_ALLOW_SCOPE_OVERLAP',kind:'写域重叠',items:problems,W,
  report:{gate:'dispatch-guard',inFlight:inFlight.map(x=>({tok:x.tok,seat:x.seat,paths:x.paths})),problems,ok:problems.length===0}});
failFast(exitCode);
