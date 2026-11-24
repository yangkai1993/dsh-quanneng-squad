import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { W, runGate, failFast } from '../lib/gate-kit.mjs';
import { bodyAnchor } from './proposals.mjs';
// L4 成熟度门：按《全能编程小队-落地手册》§7.6 逐条判定「小队是否到达 L4」。
// 原则：用 L4 自己的方法（机器态 + 证据 + 逐态 + 熔断）判定 L4，不由指挥嘴说。
const PKG = join(W, 'packages/dsh-quanneng-squad');
const L4DIR = join(PKG, 'scripts/l4');
const NODE = process.execPath;
const rd = p => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const ok = (b) => !!b;
const run = (a, cwd = PKG) => { const r = spawnSync(NODE, a, { cwd, encoding:'utf8', timeout:180000 }); let j=null; try { j=JSON.parse(r.stdout); } catch {} return { exit:r.status, j, out:(r.stdout||'')+(r.stderr||'') }; };
let state={}; try { state=JSON.parse(rd(join(PKG,'assets/L4-STATE.json'))); } catch {}
const proposals = state.proposals || {};
const checks = [];
const add = (id, title, pass, evidence, gap) => checks.push({ id, title, pass:ok(pass), evidence, gap: pass ? null : gap });

// M1 五态引擎在位且可执行（点火前置之一）
const files = ['engine.mjs','facts.mjs','run.mjs','toy-fixture.mjs','sync-ledger.mjs'].map(f => join(L4DIR,f));
const m1 = files.every(existsSync);
const syntax = files.filter(existsSync).every(f => run(['--check', f.replace(PKG+'/','')]).exit === 0);
const toy = run(['scripts/l4/toy-fixture.mjs']);
add('M1','五态引擎+夹具在位且实跑', m1 && syntax && toy.exit===0 && (toy.j?.checks||0)>=17,
  `files=${files.filter(existsSync).length}/5 syntax=${syntax} fixture=${toy.j?.passed}/${toy.j?.checks} exit=${toy.exit}`,
  '引擎/夹具缺失或夹具未全过');

// M2 点火前置：玩具夹具 + 真实项目 S8 基线，且 facts 不写死 true
let base={}; try { base=JSON.parse(rd(join(W,'docs/squad/pipeline/L4-BASELINE.json'))); } catch {}
const rd2 = join(W,'gateway-java/target/surefire-reports');
const hasJavaBase = existsSync(join(W,'gateway-java')); // gateway-java 剥离后走 Node 基线轨
let sure=0; if (existsSync(rd2)) for (const f of readdirSync(rd2)) if (f.endsWith('.txt')) { const m=rd(join(rd2,f)).match(/Tests run: (\d+)/); if(m) sure+=Number(m[1]); }
const facts = rd(join(L4DIR,'facts.mjs'));
const hardcoded = /toyFixturePassed\s*:\s*true|baselineCaptured\s*:\s*true/.test(facts);
const nodeBase = Number(base.nodeTests || 0);
add('M2','点火前置=夹具+基线（Java 轨或 Node 退役轨），facts 无写死 true', toy.exit===0 && !hardcoded && (hasJavaBase ? (base.javaTests>0 && sure>0) : nodeBase>0),
  `baseline.javaTests=${base.javaTests} surefire=${sure} nodeTests=${nodeBase} hasJavaBase=${hasJavaBase} factsHardcoded=${hardcoded}`,
  '基线缺失或 facts 中仍有硬编码 true');

// M3 分层自治：宪法层拒绝 / 参数层与流程层分级 / 计绿绑定真实全绿
const engine = rd(join(L4DIR,'engine.mjs'));
const hasLayers = /LAYERS\s*=/.test(engine) && /constitution/.test(engine);
const refusesConst = /宪法层永不自动变更/.test(engine);
const greenBound = /function recordGreenIteration[\s\S]{0,400}if \(!green\) return false/.test(engine);
const runSrc = rd(join(L4DIR,'run.mjs'));
const passesGreen = /hardGreen\s*=\s*facts\.greenLevel === 'hard-green'|greenLevel\s*===\s*'hard-green'/.test(runSrc);
add('M3','分层自治：宪法拒绝/分级/计绿绑定全绿', hasLayers && refusesConst && greenBound && passesGreen,
  `layers=${hasLayers} refuseConst=${refusesConst} greenBound=${greenBound} runPassesGreen=${passesGreen}`,
  '分层或计绿前置缺失');

// M4 熔断回 stable + 同主题 2 次熔断冷却 2 迭代（夹具实证 + 引擎实现）
const fuseImpl = /export function fuse[\s\S]{0,700}cooldownUntil/.test(engine);
const toyFuse = (toy.j?.checks||0)>=17 && toy.exit===0;
const fuseHistory = Object.values(proposals).some(p => (p.history||[]).some(h => /repair|rollback|熔断/.test(JSON.stringify(h))));
add('M4','熔断/冷却实现 + 夹具实证 + 历史留痕', fuseImpl && toyFuse && fuseHistory,
  `fuseImpl=${fuseImpl} toyFuse=${toyFuse} fuseHistory=${fuseHistory}`,
  '熔断机制或其实证留痕缺失');

// M5 固化后本体复核（A8）：每条 codified 提案的条款仍在本体里
// M5 本体锚点取自单一真源 proposals.mjs（D2）。
const codified = Object.entries(proposals).filter(([k,v])=>v.state==='codified');
const bodyMissing = codified.filter(([k]) => { const [f,n]=bodyAnchor(k); return !f || !rd(join(W,f)).includes(n); }).map(([k])=>k);
add('M5','固化条款本体仍存在（A8）', codified.length>0 && bodyMissing.length===0,
  `codified=${codified.length} bodyMissing=${bodyMissing.join(',')||'none'}`,
  '存在 codified 但本体条款已漂移');

// M6 计绿不被豁免稀释（A13）：facts 必须区分 hard-green / soft-green
const a13 = /hardGreen|softGreen|greenLevel|activeExemption|readExemptions/.test(facts);
add('M6','计绿不被活动豁免稀释（A13 已修）', a13,
  `factsHasExemptionAwareness=${a13}`,
  'facts 仍把带豁免的 exit 0 当 hard-green');

// M7 管线持续运行：新提案必须真实点火（不得停在 proposal 不动），且不得手刷 codified
let maxRound=0; const bd=join(W,'docs/squad/briefs');
if(existsSync(bd)) for(const f of readdirSync(bd)){const m=f.match(/round-(\d+)/); if(m) maxRound=Math.max(maxRound,Number(m[1]));}
const fresh = Object.values(proposals).filter(p => (p.history||[]).some(h => String(h.at||'').slice(0,10) >= new Date(Date.now()-3*86400000).toISOString().slice(0,10)));
const stuck = Object.entries(proposals).filter(([k,v]) => v.state==='proposal' && (v.history||[]).length===0).map(([k])=>k);
const handBrushed = codified.filter(([k,v]) => (v.iterationsSeen||[]).length < 2).map(([k])=>k);
add('M7','管线在跑：新提案已点火、无手刷 codified', stuck.length===0 && handBrushed.length===0,
  `maxRound=${maxRound} stuckAtProposal=${stuck.join(',')||'none'} handBrushed=${handBrushed.join(',')||'none'} recentHistory=${fresh.length}`,
  '存在从未点火的提案或手刷固化');

// M8 账本由机器态渲染，无手写状态
const pipe = rd(join(W,'docs/squad/pipeline/PIPELINE.md'));
const rendered = /sync-ledger\.mjs/.test(pipe) && Object.keys(proposals).every(k => pipe.includes(k));
add('M8','PIPELINE.md 由 L4-STATE.json 渲染', rendered, `rendered=${rendered} proposals=${Object.keys(proposals).length}`, '账本与机器态分叉');

// M9 自优化闭环：G-REFLOW 的新模式进入 L4 提案池（不排队=闭环断）
const greflow = rd(join(W,'docs/squad/gates/G-REFLOW.md'));
const pids = [...new Set([...greflow.matchAll(/^\|\s*(P\d+)\s*\|/gm)].map(m=>m[1]))];
const knownL4 = Object.keys(proposals);
const l4Id = p => 'P-' + String(p.slice(1)).padStart(3,'0');
const queued = pids.filter(p => !knownL4.includes(l4Id(p)));
add('M9','新反复模式自动进入 L4 提案池', queued.length===0,
  `greflowPatterns=${pids.length} queuedMissing=${queued.join(',')||'none'} l4Proposals=${knownL4.join(',')}`,
  'G-REFLOW 有新 P 未登记为 L4 提案（闭环断）');

// M10 无未熔断的假绿残留：codified 的 history 不得含 projectGreenNow:false 的固化
const fakeGreen = codified.filter(([k,v]) => {
  const h=v.history||[];
  const bad=h.filter(x=>x.to==='codified'&&x.factsSnapshot?.projectGreenNow===false);
  const repaired=h.some(x=>/repair|rollback/.test(JSON.stringify(x)));
  const finalGood=h.filter(x=>x.to==='codified').slice(-1)[0]?.factsSnapshot?.projectGreenNow===true;
  return bad.length>0 && !(repaired && finalGood);
}).map(([k])=>k);
add('M10','无未回滚的假绿固化', fakeGreen.length===0, `fakeGreen=${fakeGreen.join(',')||'none'}`, '存在非绿迭代固化未回滚');

// M11 判定时刻必须是 hard-green：L4 到达不能建立在项目红态上（A11/C5）。
let liveFacts={}; try { const mod=await import('./facts.mjs'); liveFacts=mod.collectFacts(W); } catch {}
add('M11','判定时刻 hard-green（无活动豁免且项目全绿）', liveFacts.greenLevel==='hard-green',
  `greenLevel=${liveFacts.greenLevel} activeExemptions=${(liveFacts.activeExemptions||[]).join(',')||'none'} checks=${JSON.stringify(liveFacts.checks?.projectGreen||{})}` ,
  '当前项目非 hard-green，L4 到达判定不成立');

const passed = checks.filter(c=>c.pass).length;
const snap = { at:new Date().toISOString(), level:'L4', passed, total:checks.length, reached: passed===checks.length, checks };
// 第3期重构：统一走 gate-kit 协议（保留 snap 的 level/reached/checks 字段供消费方读取）
const failures = checks.filter(c => !c.pass).map(c => c.id + ': ' + c.gap);
const exitCode = runGate({ name:'l4-maturity', varName:'QUANNENG_ALLOW_L4_GAP', kind:'L4 成熟度差距',
  items: failures, W, report: snap });
if (snap.reached) console.error('[L4 到达] 全部 '+checks.length+' 项判据通过');
failFast(exitCode);
