import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// 真源防回归夹具（source-of-truth fixture）：
// 复现「叙述文档能制造轮次」这个真实事故——往 STATE.md 写「第999轮」，验证真源不受影响。
// 这是从虚报事故中固化的一等教训：控制面(事件日志)与叙述面(STATE.md)必须分离(CQRS)。
const checks = [];
const ck = (n, ok, extra) => checks.push({ check: n, ok: !!ok, extra: extra === undefined ? '' : String(extra).slice(0, 140) });
const HERE = dirname(fileURLToPath(import.meta.url));
const PKGDIR = join(HERE, '..');
const NODE = process.env.QUANNENG_NODE || 'node';
const tmp = mkdtempSync(join(tmpdir(), 'truth-fixture-'));

function evalIn(code, ws) {
  return spawnSync(NODE, ['-e', code], { cwd: PKGDIR, encoding: 'utf8', timeout: 60000,
    env: { ...process.env, QUANNENG_WORKSPACE: ws } });
}
function jsonOf(r) { try { return JSON.parse((r.stdout || '').trim()); } catch { return null; } }

try {
  for (const d of ['docs/squad/events','docs/squad']) mkdirSync(join(tmp, d), { recursive: true });
  // 播种不可变事件：第 7 轮
  writeFileSync(join(tmp, 'docs/squad/events/round-events.jsonl'),
    JSON.stringify({ seq:1, ts:new Date().toISOString(), type:'ROUND_ADVANCE', from:0, to:7,
      reason:'夹具基线', actor:'fixture' }) + '\n');
  const statePath = join(tmp, 'docs/squad/STATE.md');
  writeFileSync(statePath, '正常叙述\n');

  // 1) 基线：真源=7
  let r = evalIn("import('./scripts/lib/rotation.mjs').then(m=>console.log(JSON.stringify(m.currentRotation(process.env.QUANNENG_WORKSPACE))))", tmp);
  let j = jsonOf(r);
  ck('基线：事件真源 round=7', j?.round === 7, 'round=' + j?.round);

  // 2) 事故复现：往叙述文档写「第九百九十九轮」——真源必须不变
  writeFileSync(statePath, '正常叙述\n\n第九百九十九轮（篡改探针）\n');
  r = evalIn("import('./scripts/lib/rotation.mjs').then(m=>console.log(JSON.stringify(m.currentRotation(process.env.QUANNENG_WORKSPACE))))", tmp);
  j = jsonOf(r);
  ck('叙述篡改不驱动轮次（核心修复）', j?.round === 7, 'round=' + j?.round);

  // 3) facts 迭代标识同样不受叙述影响
  r = evalIn("import('./scripts/l4/facts.mjs').then(m=>console.log(JSON.stringify({it:m.collectFacts(process.env.QUANNENG_WORKSPACE).projectIteration})))", tmp);
  j = jsonOf(r);
  ck('facts 迭代标识同源（round-7）', j?.it === 'round-7', 'it=' + j?.it);

  // 3b) R-01 回归：cmdIssueToken 必须真落盘（专家实跑发现 EVENTS_PATH 未定义，令牌事件永不写入）。
  r = evalIn("import('./scripts/lib/round-events.mjs').then(m=>{try{m.cmdIssueToken({round:7,w:'W1',seat:'x',token:'TK-7-901',path:'docs/x'});const ev=m.loadEvents();console.log(JSON.stringify({ok:true,inLog:ev.some(e=>e.token==='TK-7-901')}))}catch(e){console.log(JSON.stringify({ok:false,err:e.message}))}})", tmp);
  const ir = jsonOf(r);
  ck('cmdIssueToken 真落盘（R-01 修复）', ir?.ok === true && ir?.inLog === true, JSON.stringify(ir)?.slice(0,100));

  // 3c) 幂等：重复登记同一令牌不产生第二条事件。
  r = evalIn("import('./scripts/lib/round-events.mjs').then(m=>{m.cmdIssueToken({round:7,w:'W1',seat:'x',token:'TK-7-901',path:'docs/x'});console.log(JSON.stringify(m.loadEvents().length))})", tmp);
  ck('令牌登记幂等（不重复事件）', jsonOf(r) === 2, 'events=' + (r.stdout||'').trim());

  // 4) 只有合法命令能推进：+1 允许，跳跃/回退拒绝
  r = evalIn("import('./scripts/lib/round-events.mjs').then(m=>{try{m.cmdAdvance(8,'夹具合法推进','fixture');console.log('OK')}catch(e){console.log('ERR:'+e.message)}})", tmp);
  ck('合法命令 +1 推进成功', (r.stdout||'').includes('OK'), (r.stdout||'').trim().slice(0,80));
  r = evalIn("import('./scripts/lib/round-events.mjs').then(m=>{try{m.cmdAdvance(99,'跳跃','fixture');console.log('OK')}catch(e){console.log('ERR:'+e.message)}})", tmp);
  ck('跳跃推进被拒（不可伪造轮次）', (r.stdout||'').includes('ERR'), (r.stdout||'').trim().slice(0,80));
  r = evalIn("import('./scripts/lib/rotation.mjs').then(m=>console.log(JSON.stringify(m.currentRotation(process.env.QUANNENG_WORKSPACE))))", tmp);
  j = jsonOf(r);
  ck('推进后真源=8 且叙述仍未生效', j?.round === 8, 'round=' + j?.round);

  // 5) 事件日志不可变：叙述删除不影响事件派生
  rmSync(statePath, { force: true });
  r = evalIn("import('./scripts/lib/rotation.mjs').then(m=>console.log(JSON.stringify(m.currentRotation(process.env.QUANNENG_WORKSPACE))))", tmp);
  j = jsonOf(r);
  ck('叙述文档删除后真源仍在', j?.round === 8, 'round=' + j?.round);

} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const passed = checks.filter(c => c.ok).length, failed = checks.length - passed;
console.log(JSON.stringify({ fixture: 'source-of-truth', checks, passed, failed, ok: failed === 0 }, null, 2));
if (failed) process.exit(1);
