import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { W, TERMINAL_RE, PENDING_RE } from './lib/gate-kit.mjs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
// 持续监督：只从实测取数；陈旧 surefire 报告（非最新批次）不参与 verdict；
// expected-red（负向探针中间态）与 regression-red（真回归）分开报。

const PKGDIR=join(W,'packages/dsh-quanneng-squad');
const NODE=process.execPath;
const run=(args,cwd=PKGDIR)=>{const r=spawnSync(NODE,args,{cwd,encoding:'utf8',timeout:180000});let j=null;try{j=JSON.parse(r.stdout);}catch{}return{exit:r.status,j};};
const gates={};
for(const g of ['seat-utilization','audit-roster','reflow-check','stage-order','drift-check','dispatch-guard','lead-scope-check']) gates[g]=run(['scripts/'+g+'.mjs']).exit;
const rv=run(['scripts/result-verify.mjs']);
const pv=run(['scripts/pre-verify.mjs']);
const seat=run(['scripts/seat-utilization.mjs']);
const memSla=run(['scripts/memory-sla.mjs']);
const panelSync=run(['scripts/panel-sync.mjs']);   // 数据治理共识：双账核对每轮必跑
const memorySla={exit:memSla.exit,problems:memSla.j?.problems||[],pending:memSla.j?.pendingReplay,decisions:memSla.j?.decisions};
const seatRolling=seat.j?.rolling||null;
const DSP=join(W,'docs/squad/dispatch');
const byToken=new Map(); const expected=[];
if(existsSync(DSP)) for(const f of readdirSync(DSP)){
  if(!f.endsWith('.md'))continue;
  const t=readFileSync(join(DSP,f),'utf8');
  for(const sec of t.split(/\n(?=## )/)){
    for(const m of sec.matchAll(/\|\s*探针中间态\s*\|([^\n]*)/g))
      expected.push(...m[1].split(/[,，;；]/).map(s=>s.replace(/\|/g,'').trim()).filter(Boolean));
    const tm=sec.match(/\|\s*令牌\s*\|\s*(TK-\d+-\d+)/);
    const sm=sec.match(/\|\s*状态\s*\|([^\n]*)/);
    if(tm&&sm) byToken.set(tm[1],{seat:f.replace('.md',''),tok:tm[1],status:sm[1].replace(/\|/g,'').trim()});
  }
}
const TERMINAL=TERMINAL_RE;   // R-2：词表真源在 gate-kit，杜绝与 verify/dispatch-guard 分叉
const inFlight=[...byToken.values()].filter(x=>PENDING_RE.test(x.status)&&!TERMINAL.test(x.status));
const RD=join(W,'gateway-java/target/surefire-reports');
let java={verdict:'unknown',failures:[],reports:0,staleIgnored:0};
if(existsSync(RD)){
  const fs2=readdirSync(RD).filter(f=>f.endsWith('.txt'));
  const items=fs2.map(f=>({f,m:new Date(statSync(join(RD,f)).mtime).getTime()}));
  // 以「批次众数」判定：把 mtime 按 5 分钟分桶，取报告数最多的桶为最新全量批次。
  // 局部 -Dtest 只刷新 1 个文件，不会把其余全量报告误判为陈旧。
  const buckets=new Map();
  for(const x of items){const k=Math.floor(x.m/(5*60*1000));buckets.set(k,(buckets.get(k)||0)+1);}
  const mainBucket=+[...buckets.entries()].sort((a,b)=>b[1]-a[1])[0][0];
  const fresh=items.filter(x=>Math.floor(x.m/(5*60*1000))===mainBucket);
  java.batchFallback=fresh.length<3;
  java.reports=fresh.length; java.staleIgnored=items.length-fresh.length;
  const fails=[];
  for(const {f} of fresh){
    const t=readFileSync(join(RD,f),'utf8');
    const m=t.match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+)/);
    if(m&&(+m[2]>0||+m[3]>0)) for(const l of t.split('\n'))
      if(/<<< FAILURE!|<<< ERROR!/.test(l)){
        const c=(l.match(/-- in ([\w.]+)/)||[])[1]||l.trim().slice(0,80);
        fails.push({file:f,case:c,expected:expected.some(e=>c.includes(e))});
      }
  }
  java.failures=fails;
  java.verdict=fails.length===0?'green':fails.every(x=>x.expected)?'expected-red':'regression-red';
}
const ageH=p=>{try{const st=statSync(join(W,p));return +((Date.now()-new Date(st.mtime).getTime())/3600000).toFixed(1);}catch(e){return null;}};
const bd=join(W,'docs/squad/briefs');
const briefs=existsSync(bd)?readdirSync(bd).filter(f=>/round-\d+\.md/.test(f)).sort():[];
const pulseAge=ageH('docs/squad/TEAM-PULSE.md');
const briefAge=briefs.length?ageH('docs/squad/briefs/'+briefs[briefs.length-1]):null;
let l4={};try{l4=Object.fromEntries(Object.entries(JSON.parse(readFileSync(join(PKGDIR,'assets/L4-STATE.json'),'utf8')).proposals).map(([k,v])=>[k,v.state]));}catch{}
// t10 修复：面板卡（live team.json）也是令牌生命周期数据源——in_progress/claimed/pending=在途，
// failed=须处置第三态；此前只读 dispatch md 状态列，5 张面板在途被词表漏判静默忽略。
let panelTasks={ total:0, inflight:[], failed:[], other:0, readError:null };
{
  const tjF=join(W,'.agent-teams/quanneng-squad/team.json');
  try {
    const tj=JSON.parse(readFileSync(tjF,'utf8'));
    for (const x of tj.tasks||[]) {
      panelTasks.total++;
      if (x.status==='failed') panelTasks.failed.push(x.id);
      else if (x.status==='completed' || TERMINAL_RE.test(x.subject||'')) { /* 终止 */ }
      else if (PENDING_RE.test(x.status||'')) panelTasks.inflight.push(x.id);
      else panelTasks.other++;
    }
  } catch (e) { panelTasks.readError = String(e && e.message || e); }
}
// 零在途收敛标记：dispatch 在途 + 面板在途 + 面板 failed 三源皆空才 true（不靠指挥记忆）。
const attention = [
  ...Object.entries(gates).filter(([k,v])=>v!==0).map(([k,v])=>'门红: '+k+'='+v),
  ...(java.verdict==='regression-red'?['Java 真回归红（非探针）']:[]),
  ...(java.verdict==='expected-red'?['Java 探针中间态红：等待还原输出，不宣布完整绿']:[]),
  ...(pulseAge!==null&&pulseAge>2?['TEAM-PULSE 超过 2h 未刷新']:[]),
  ...(memorySla.problems.length?['memory-sla 阻断：'+memorySla.problems.join('；')]:[]),
  ...(pv.exit!==0?['pre-verify 阻断（Java 卡证据缺失/过期）：'+(pv.j?.problems||[]).slice(0,2).join('；')]:[]),
  ...(seatRolling && Number(seatRolling.activeSeats) < 8 ? ['席位滚动覆盖偏低：近 '+seatRolling.window+' 轮仅 '+seatRolling.activeSeats+'/16 席有派活（闲置 '+seatRolling.idleSeats.length+' 席）'] : []),
  ...(panelSync.exit!==0||!panelSync.j||!panelSync.j.tokens?'panel-sync 双账视图不可用':[]),
  ...inFlight.map(x=>'在途 '+x.tok+'('+x.seat+')'),
  ...(panelTasks.inflight.length?['面板在途 '+panelTasks.inflight.length+' 卡：'+panelTasks.inflight.join(',')]:[]),
  ...(panelTasks.readError?['面板 team.json 读取失败（fail-closed，不可判收敛）: '+panelTasks.readError]:[]),
  ...(panelTasks.failed.length?['面板 failed 待裁 '+panelTasks.failed.join(',')+'：assignee 不可作执行者证据，须 reassign 或标已闭合']:[])
];
// R-1（TK-58-03）：memory-sla 阻断也进收敛否决面——积压超限=交付链未闭合，不许标 converged。
const tokenConverged = !panelTasks.readError && inFlight.length === 0 && panelTasks.inflight.length === 0 && panelTasks.failed.length === 0 && memorySla.exit === 0 && !attention.some(x => /在途|门红|真回归|memory-sla 阻断|面板/.test(x));
// R7：单在途长期未回报时机器标记升级条件（指挥不催、不 sleep，只让轮次年龄可见）。
const singleFlightAge = inFlight.length === 1 ? { token: inFlight[0].tok, seat: inFlight[0].seat,
  note: 'R-W 等待回报；若下一轮仍无回报且席位转 inactive，按 A1 重投或 hand_back 裁决' } : null;
const snap={at:new Date().toISOString(),tokenConverged,singleFlightAge,panelTasks,gates,
  resultVerify:{exit:rv.exit,gaps:rv.j?.gapItems||[]},preVerify:{exit:pv.exit,scanned:pv.j?.scannedJavaCards,problems:pv.j?.problems||[]},seatRolling,memorySla,
  inFlight:[...new Set(inFlight.map(x=>x.tok))].map(t=>inFlight.find(x=>x.tok===t)),
  expectedProbes:expected,java,freshness:{pulseHours:pulseAge,briefHours:briefAge},l4,attention};
console.log(JSON.stringify(snap,null,2));
