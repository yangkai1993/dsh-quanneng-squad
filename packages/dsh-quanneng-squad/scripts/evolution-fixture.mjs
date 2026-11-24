import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// 进化回归夹具：重放「专家发现→修复→门」的矛盾场景，每次 release 验证防线仍在。
// 真源迁移（P14）：轮次由 round-events.jsonl 事件日志派生，临时 workspace 必须播种事件。
const checks = [];
const ck = (n, ok, extra) => checks.push({ check: n, ok: !!ok, extra: extra === undefined ? '' : String(extra).slice(0, 140) });
const HERE = dirname(fileURLToPath(import.meta.url));
const PKGDIR = join(HERE, '..');
const NODE = process.env.QUANNENG_NODE || 'node';
const tmp = mkdtempSync(join(tmpdir(), 'evo-fixture-'));
const NL = String.fromCharCode(10);

function seedWs() {
  for (const d of ['docs/squad/dispatch','docs/squad/gates','docs/squad/events','docs/squad/briefs','assets','.agent-teams/quanneng-squad']) mkdirSync(join(tmp,d), {recursive:true});
  writeFileSync(join(tmp,'docs/squad/STATE.md'),'2026-11-17（第一轮·夹具）'+NL);
  // 事件真源：第 1 轮（rotation.mjs 从事件派生，不读 STATE）
  const ev={seq:1,ts:new Date().toISOString(),type:'ROUND_ADVANCE',from:0,to:1,reason:'evolution-fixture 基线',actor:'fixture'};
  writeFileSync(join(tmp,'docs/squad/events/round-events.jsonl'),JSON.stringify(ev)+NL);
  const w1='| W1 | S-1 | 翰林、采风、集贤、太傅、需求、产品、给事中、御史 | 谋断 |';
  const w2='| W2 | S0 | 需求、产品、架构、给事中、御史、后端、测试、交付 | 架构 |';
  const w3='| W3 | 实现 | 前端、后端、架构、测试、御史、运维、交付、需求 | 实现 |';
  const w4='| W4 | 复盘 | 考功、起居注、给事中、御史、交付、需求、产品、架构 | 复盘 |';
  writeFileSync(join(tmp,'docs/squad/ROSTER-16.md'),
    ['## 七、轮次名册','','| 轮次 | 阶段 | 在席 8 角色 | 覆盖理念 |','| --- | --- | --- | --- |',w1,w2,w3,w4,''].join(NL));
  writeFileSync(join(tmp,'docs/squad/gates/routes.json'),JSON.stringify({allowed:['our-free-model/nvidia/nemotron-3-ultra-550b-a55b:free'],dead:[],updatedAt:'2026-11-17T00:00:00Z'},null,2));
  writeFileSync(join(tmp,'docs/squad/gates/AVAILABLE-ROUTES.md'),
    ['| 路由 | effort | 状态 | 证据 |','| --- | --- | --- | --- |','| our-free-model/nvidia/nemotron-3-ultra-550b-a55b:free | medium | 可用 | 夹具 |',''].join(NL));
  writeFileSync(join(tmp,'docs/squad/gates/EXEMPTIONS.md'),
    ['## 当前豁免','','| 门 | 到期 | 原因 | 登记人 | 会签人 | 闭合条件 |','| --- | --- | --- | --- | --- | --- |',''].join(NL));
  const seats=['翰林学士','采风官','集贤学士','太傅','需求经理','产品经理','给事中','御史大夫'];
  for (const s of seats) writeFileSync(join(tmp,'docs/squad/dispatch/'+s+'.md'),'# '+s+NL);
  return seats;
}
function runGateScript(script) {
  return spawnSync(NODE,['scripts/'+script],{cwd:PKGDIR,encoding:'utf8',timeout:120000,env:{...process.env,QUANNENG_WORKSPACE:tmp}});
}
function reportOf(r){ try { return JSON.parse((r.stdout||'').trim()); } catch { return null; } }
function card(lines){ return ['# 席位','',...lines,''].join(NL); }

try {
  const seats=seedWs();
  const dsp=join(tmp,'docs/squad/dispatch');
  const slated=tok=>card(['## 第一轮 · 轮转确认','','| 令牌 | '+tok+' |','| 状态 | 仅登记移交意图（轮转确认） |','| 签发源 | squad-autopilot |','| 轮转确认 | 是 |','| 写域 | docs/squad/prompts/ |']);

  // 场景1：字母后缀令牌（TK-1-A1）对门不可见——复现格式分裂事故。
  writeFileSync(join(dsp,'翰林学士.md'),card(['## 第一轮 · A后缀','','| 令牌 | TK-1-A1 |','| 状态 | 仅登记移交意图（轮转确认） |','| 签发源 | squad-autopilot |','| 轮转确认 | 是 |','| 写域 | docs/squad/prompts/ |']));
  let r=runGateScript('gate-rotation.mjs'), g=reportOf(r);
  ck('字母后缀令牌对门不可见（格式分裂反例）', r.status===1 && (g?.missing||[]).includes('翰林'),'missing='+JSON.stringify(g?.missing));

  // 场景2：纯数字 9xx SLATED + 签发源 + 写域 → 8/8 覆盖。
  seats.forEach((s,i)=>writeFileSync(join(dsp,s+'.md'),slated('TK-1-9'+(i+1))));
  r=runGateScript('gate-rotation.mjs'); g=reportOf(r);
  ck('纯数字9xx SLATED 8/8 覆盖', r.status===0 && (g?.missing||[]).length===0 && (g?.covered||[]).length===8,'covered='+(g?.covered||[]).length+' missing='+JSON.stringify(g?.missing));

  // 场景3：裸占位号（无签发源/写域）不算覆盖——GR-2 反伪造。
  seats.forEach((s,i)=>writeFileSync(join(dsp,s+'.md'),card(['## 第一轮 · 裸占位','','| 令牌 | TK-1-9'+(i+1)+' |','| 状态 | 仅登记移交意图 |'])));
  r=runGateScript('gate-rotation.mjs'); g=reportOf(r);
  ck('裸占位号不算覆盖（GR-2 反伪造保留）', r.status===1 && (g?.missing||[]).length===8,'missing='+(g?.missing||[]).length);

  // 场景4：SLATED 不被 dispatch-guard 判在途——分层。
  seats.forEach((s,i)=>writeFileSync(join(dsp,s+'.md'),slated('TK-1-9'+(i+1))));
  r=runGateScript('dispatch-guard.mjs'); const dg=reportOf(r);
  ck('SLATED 不误判在途（分层）', r.status===0 && (dg?.inFlight||[]).length===0,'inFlight='+(dg?.inFlight||[]).length);

  // 场景5：真在途卡（无写域）仍被 dispatch-guard 拦——在途层未削弱。
  writeFileSync(join(dsp,'翰林学士.md'),card(['## 第一轮 · 派活','','| 令牌 | TK-1-1 |','| 状态 | 在途 |']));
  r=runGateScript('dispatch-guard.mjs'); const dg2=reportOf(r);
  ck('真在途卡仍受写域检查（在途层未削弱）', r.status===1 && (dg2?.problems||[]).some(p=>String(p).includes('写域未结构化')),'problems='+JSON.stringify(dg2?.problems)?.slice(0,90));

} finally { rmSync(tmp,{recursive:true,force:true}); }

const passed=checks.filter(c=>c.ok).length, failed=checks.length-passed;
console.log(JSON.stringify({fixture:'evolution-regression',checks,passed,failed,ok:failed===0},null,2));
if (failed) process.exit(1);
