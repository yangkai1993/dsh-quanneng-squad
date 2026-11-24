import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, cn2num, maxBriefRound, runGate, failFast } from './lib/gate-kit.mjs';
// 每轮简报必须结构化声明「本轮 src 变更归属」；captain 直接改 src（非纠错）即阻断。
// A12（新建测试文件）与 A14（改核心业务类）两轮复发，靠自觉不够，进机器门。
const BD = join(W, 'docs/squad/briefs');
const problems = [];
let latest = null, maxRound = 0;
if (existsSync(BD)) for (const f of readdirSync(BD)) {
  const m = f.match(/round-(\d+)/);
  if (m && Number(m[1]) >= maxRound) { maxRound = Number(m[1]); latest = f; }
}
if (!latest) { console.log(JSON.stringify({gate:'lead-scope-check',error:'无简报'})); process.exit(1); }
const t = readFileSync(join(BD, latest), 'utf8');
const sec = t.split(/\n(?=## )/).find(s => /^##\s+本轮 src 变更归属/.test(s.trim()));
if (!sec) problems.push('简报 ' + latest + ' 缺「## 本轮 src 变更归属」段：时刻监督要求每轮必写');
else {
  const em = sec.match(/\|\s*执行者\s*\|([^\n]*)/);
  if (!em) problems.push('src 变更归属段缺 | 执行者 | 行');
  else {
    const who = em[1].trim();
    if (/captain|总指挥|指挥/i.test(who) && !/纠错|恢复|A14/.test(who))
      problems.push('指挥越界：本轮 src 变更执行者为「' + who + '」且未标注纠错（C1/§1）');
    if (!/^无[（(]|^无$|^无变更|captain|总指挥|指挥|纠错/i.test(who)) {
      const seat = who.replace(/@v\d+/, '').trim();
      const card = join(W, 'docs/squad/dispatch', seat + '.md');
      const hasTok = existsSync(card) && new RegExp('第\\s*' + maxRound + '\\s*轮[\\s\\S]{0,400}TK-\\d+-\\d+').test(readFileSync(card, 'utf8'));
      if (!hasTok) problems.push('声明执行者 ' + who + ' 在本轮 dispatch 卡中无对应令牌（抽验失败）');
    }
  }
}
const exitCode=runGate({name:'lead-scope-check',varName:'QUANNENG_ALLOW_LEAD_SCOPE',kind:'指挥越界/归属段缺失',items:problems,W,report:{gate:'lead-scope-check',brief:latest,problems,ok:problems.length===0}});
failFast(exitCode);
