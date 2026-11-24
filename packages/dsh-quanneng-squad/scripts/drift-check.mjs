import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
import { join, dirname } from 'node:path';
// 文件腐化门（S8 起居注官工位）：扫描治理文档里的两类腐化，
//   A) 死指针：`file:line` 形式的引用，目标文件不存在或行号超出实际行数；
//   B) 过期状态：台账/文档里「0 → 本轮补」「0 → 待补」这类状态行，而对应目录其实已有产物。
// 产出实时 JSON（stdout 纯 JSON），阻断项走 stderr + exit 1（豁免见 EXEMPTIONS.md）。
const NAME = 'drift-check';
// 文件索引：assets/file-index.json 由 update-file-index.mjs 维护（全仓文件相对路径清单）。
// 解析 file:line 引用先按文件名查索引，命中即活——消除「手工候选清单」的盲区假阳性。
const VAR = 'QUANNENG_ALLOW_DRIFT';

const PKG_DIR = join(W, 'packages/dsh-quanneng-squad');
const MAX_AGE_DAYS = 7;   // 情报/台账类工件的最大时效

const SCAN_DOCS = [
  'AGENTS.md',
  'docs/squad/pipeline/DELIVERY-PIPELINE.md',
  'docs/squad/pipeline/PIPELINE.md',
  'docs/squad/FUNCTION-LEDGER.md',
  'docs/arch/api-contract.md',
  'docs/arch/sys-arch.md',
  'docs/squad/gates/G-REFLOW.md',
  'docs/squad/gates/G-S7.md',
  'docs/squad/cr/CR-003-java-crypto-params.md',
  'docs/squad/cr/CR-004-java-shell.md',
];

function resolveRef(fromDoc, ref) {
  const idxPath = join(PKG_DIR, 'assets/file-index.json');
  if (existsSync(idxPath)) {
    try {
      const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
      const base = ref.split('/').pop();
      const hit = idx.find(p => p === ref || p.endsWith('/' + ref) || p.endsWith('/' + base));
      if (hit) return join(W, hit);
    } catch {}
  }
  const cands = ref.includes('/')
    ? [join(W, ref), join(PKG_DIR, ref)]
    : [join(W, dirname(fromDoc), ref), join(W, ref), join(PKG_DIR, ref), join(PKG_DIR, 'lib', ref),
       join(PKG_DIR, 'scripts', ref), join(PKG_DIR, 'gateway-java/src/main/java/com/unionpay/tradein', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein/crypto', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein/north', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein/protocol', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein/contract', ref),
       join(W, 'gateway-java/src/main/java/com/unionpay/tradein/core', ref),
       join(W, 'src', ref), join(W, 'src/crypto', ref), join(W, 'src/core', ref), join(W, 'src/north', ref),
       join(W, 'src/protocol', ref), join(W, 'src/transport', ref), join(W, 'docs/arch', ref)];
  for (const c of cands) if (existsSync(c)) return c;
  return null;
}

function scanPointers() {
  const problems = [];
  let alive = 0;
  for (const doc of SCAN_DOCS) {
    const abs = join(W, doc);
    if (!existsSync(abs)) { problems.push('文档缺失: ' + doc); continue; }
    const text = readFileSync(abs, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      for (const m of line.matchAll(/([A-Za-z0-9_.\-\/]+\.(?:md|js|mjs|java|yml|json)):(\d+)/g)) {
        const ref = m[1], ln = Number(m[2]);
        if (/^\d/.test(ref)) return;   // 版本号/日期误匹配
        const abs2 = resolveRef(doc, ref);
        if (!abs2) { problems.push(doc + ':' + (idx + 1) + ' 死指针 ' + m[0] + '（文件不存在）'); return; }
        const n = readFileSync(abs2, 'utf8').split('\n').length;
        if (ln > n) problems.push(doc + ':' + (idx + 1) + ' 行号越界 ' + m[0] + '（实际 ' + n + ' 行）');
        else alive++;
      }
    });
  }
  return { problems, alive };
}

// B) 过期状态声明：台账说「0 → 待补」但产物目录已非空
function scanStaleClaims() {
  const problems = [];
  const CLAIM_DIRS = [
    ['测试经理', 'docs/qa'], ['运维经理', 'deploy'], ['太傅', 'docs/squad'],
    ['采风官', 'docs/squad/intel'], ['集贤学士', 'docs/squad/prompts'], ['翰林学士', 'docs/squad/pipeline'],
    ['前端经理', 'docs/squad/reviews'], ['交付发布经理', 'docs/squad/releases'], ['考功郎中', 'docs/squad/metrics'],
  ];
  const lp = join(W, 'docs/squad/FUNCTION-LEDGER.md');
  if (!existsSync(lp)) return problems.push('FUNCTION-LEDGER.md 缺失');
  const ledger = readFileSync(lp, 'utf8');
  for (const [seat, dir] of CLAIM_DIRS) {
    const row = ledger.split('\n').find(l => l.includes('| ' + seat + ' |'));
    if (!row) continue;
    const saysZero = /\*\*0\s*→\s*本轮补\*\*|0\s*→\s*待补/.test(row);
    const d = join(W, dir);
    let n = 0;
    if (existsSync(d) && statSync(d).isDirectory()) {
      const stack = [d];
      while (stack.length && n === 0) {
        const cur = stack.pop();
        for (const e of readdirSync(cur, { withFileTypes: true })) {
          if (e.name.startsWith('.')) continue;
          const f = join(cur, e.name);
          if (e.isDirectory()) { if (stack.length < 200) stack.push(f); } else if (e.name !== 'INDEX.md') { n++; break; }
        }
      }
    }
    if (saysZero && n > 0) problems.push('FUNCTION-LEDGER「' + seat + '」状态过期：写 0 但 ' + dir + ' 已有 ' + n + ' 个工件');
    if (!saysZero && n === 0 && row.includes('✅')) problems.push('FUNCTION-LEDGER「' + seat + '」状态虚高：写已交付但 ' + dir + ' 为空');
  }
  return problems;
}

// C) 情报时效：intel/ 下最老文件超过 MAX_AGE_DAYS 天即提示（不算阻断，只进 stderr 提醒）
function intelAge() {
  const d = join(W, 'docs/squad/intel');
  if (!existsSync(d)) return null;
  let oldest = 0;
  for (const f of readdirSync(d)) {
    const age = (Date.now() - statSync(join(d, f)).mtimeMs) / 864e5;
    if (age > oldest) oldest = age;
  }
  return Math.floor(oldest);
}

// D) 提示词版本漂移：INDEX.md/AGENTS 声明的现行版 vs prompts/ 目录实际最高版
function scanVersionDrift() {
  const problems = [];
  const dir = join(W, 'docs/squad/prompts');
  if (!existsSync(dir)) return problems;
  const files = readdirSync(dir);
  const latest = {};
  for (const f of files) {
    const m = f.match(/^(.+?)-v(\d+)\.md$/);
    if (m && (!latest[m[1]] || Number(m[2]) > latest[m[1]])) latest[m[1]] = Number(m[2]);
  }
  const idxPath = join(dir, 'INDEX.md');
  if (existsSync(idxPath)) {
    const idx = readFileSync(idxPath, 'utf8');
    for (const [role, v] of Object.entries(latest)) {
      // 取首个匹配 = 主表行；若未来有人把历史小节挪到主表之前，本规则会误判 —— 结构约定：主表必须在前。
      const m = idx.match(new RegExp('\\|\\s*' + role + '\\s*\\|\\s*' + role + '-v(\\d+)\\.md'));
      if (m && Number(m[1]) < v) problems.push('INDEX.md 版本漂移：' + role + ' 目录最高 v' + v + '，INDEX 仍列 v' + m[1]);
    }
  }
  return problems;
}
// E) 传输损坏：成员会话在某些模型/通道下把 \n 压成 ','（实测 v2 稿 58 处）。扫描治理目录全部 md。
function scanTransferCorruption() {
  const problems = [];
  const dirs = ['docs/squad/prompts', 'docs/squad/journal', 'docs/squad/audit', 'docs/qa',
                'docs/squad/releases', 'docs/squad/reviews', 'docs/squad/metrics', 'docs/squad/gates'];
  for (const d of dirs) {
    const abs = join(W, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith('.md') || f.startsWith('.')) continue;
      const t = readFileSync(join(abs, f), 'utf8');
      // 表格行内的合法逗号不会紧跟列表标记或连续出现；命中即判损坏
      const n = (t.match(/,,|,- |\n,- |,\|/g) || []).length;
      if (n >= 3) problems.push(d + '/' + f + ' 疑似传输损坏（\\n 被压成逗号）：' + n + ' 处，建议重写该文件');
    }
  }
  return problems;
}
// F) 任务书引用的契约条款必须存在（P9：引用不存在的 §N/第N点 就是转写基准的前兆）
function scanBriefClauseRefs() {
  const problems = [];
  const contractPath = join(W, 'docs/arch/api-contract.md');
  if (!existsSync(contractPath)) return ['api-contract.md 缺失，无法校验任务书条款引用'];
  const contract = readFileSync(contractPath, 'utf8');
  const sections = new Set(Array.from(contract.matchAll(/^##\s*(\d+)/gm), m => m[1]));
  const dd = join(W, 'docs/squad/dispatch');
  if (!existsSync(dd)) return problems;
  for (const f of readdirSync(dd)) {
    if (!f.endsWith('.md')) continue;
    const t = readFileSync(join(dd, f), 'utf8');
    for (const m of t.matchAll(/§(\d+)(?!\d)/g)) {
      if (!sections.has(m[1])) problems.push('dispatch/' + f + ' 引用 §' + m[1] + '，但 api-contract.md 无该节');
    }
  }
  return problems;
}
// G) 派活令牌生命周期（A1 黑洞修复）：dispatch 卡里的每个 TK-*-* 必须有闭合证据——
//    captain 回报（done/完成/验收通过）或 席位仍在 running（任务还活着）。
//    两者皆无 = 任务书躺在邮箱没人执行（TK-41-01 实案：wake 成功但 8 路由 0 实现）。
const CNd = { 零:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10 };
function cn2num(s) {
  if (s == null) return NaN;
  s = String(s).trim();
  if (/^\d+$/.test(s)) return Number(s);
  if (!s) return NaN;
  if (s.includes('十')) {
    const [t, o] = s.split('十');
    const tens = t === '' ? 1 : (CNd[t] ?? NaN);
    const ones = o === '' || o === undefined ? 0 : (CNd[o] ?? NaN);
    return Number.isNaN(tens) || Number.isNaN(ones) ? NaN : tens * 10 + ones;
  }
  return CNd[s] ?? NaN;
}
const roundOf = (sec) => {
  const m = sec.match(/第\s*([0-9一二三四五六七八九十]+)\s*轮/);
  return m ? cn2num(m[1]) : NaN;
};

// D3：契约章节编号必须 1..N 连续（此前 10/9/10/11 乱序且 §8 曾整段丢失）
function contractSectionOrder(W2) {
  const t = readFileSync(join(W2, 'docs/arch/api-contract.md'), 'utf8');
  const n = [...t.matchAll(/^##\s*(\d+)\./gm)].map(m => Number(m[1]));
  const bad = n.length < 12 || !n.every((v,i) => i===0 || v===n[i-1]+1);
  return bad ? ['api-contract.md 章节编号不连续：' + n.join(',')] : [];
}
// D4：AGENTS.md 不得硬编码「当前 v<n>」（版本真源只在 INDEX 主表）
function agentsVersionDrift(W2) {
  const t = readFileSync(join(W2, 'AGENTS.md'), 'utf8');
  return /当前 v\d/.test(t) ? ['AGENTS.md 硬编码提示词版本，应引用 INDEX.md 主表'] : [];
}

function scanTokenLifecycle() {
  const problems = [];
  const dspDir = join(W, 'docs/squad/dispatch');
  if (!existsSync(dspDir)) return problems;
  // 闭合凭据只认两种结构化事实（散文一律无效 —— A11/P3：叙述不得当验收）：
  //   ① captain 邮箱出现该令牌（成员回报落库）
  //   ② dispatch 段落含结构化行：| 状态 | ...（已闭合|验收通过|作废|重派替代|已撤销|非投递|仅登记移交意图）...
  const capPath = join(W, '.agent-teams/quanneng-squad/inbox/captain.jsonl');
  let capText = '';
  try { capText = readFileSync(capPath, 'utf8'); } catch {}
  const inInbox = new Set(Array.from(capText.matchAll(/TK-\d+-\d+/g), m => m[0]));
  let maxRound = 0;
  try { for (const f of readdirSync(join(W, 'docs/squad/briefs'))) { const m = f.match(/round-(\d+)/); if (m) maxRound = Math.max(maxRound, Number(m[1])); } } catch {}
  const running = new Set((process.env.QUANNENG_RUNNING_SEATS || '').split(',').filter(Boolean));
  for (const f of readdirSync(dspDir)) {
    if (!f.endsWith('.md')) continue;
    const seat = f.replace('.md', '');
    const t = readFileSync(join(dspDir, f), 'utf8');
    const cardClosed = /\|\s*状态\s*\|[^\n]*(已闭合|验收通过|作废|重派替代|已撤销|非投递|仅登记移交意图)/.test(t);
    for (const sec of t.split(/\n(?=## )/)) {
      const round = roundOf(sec);
      if (Number.isNaN(round) || round >= maxRound || round < maxRound - 5) continue;
      const structClosed = cardClosed;
      for (const tm of sec.matchAll(/TK-(\d+-\d+)/g)) {
        const tok = 'TK-' + tm[1];
        if (inInbox.has(tok) || structClosed) continue;
        if (running.has(seat)) continue;
        const msg = '派活黑洞 ' + seat + ' ' + tok + '：第' + round + '轮起投递后无闭合凭据（邮箱回报／结构化|状态|行／席位 running 三选一）。注意 A9：成员若仅经 subagent 文本回报，邮箱不会有记录 —— 指挥须核实代码后补结构化状态行，不得凭记忆宣布闭合。';
        if (!problems.includes(msg)) problems.push(msg);
      }
    }
  }
  return problems;
}
const p1 = scanPointers();
const p2 = scanStaleClaims();
const problems = p1.problems.concat(p2, scanVersionDrift(), scanTransferCorruption(), scanBriefClauseRefs(), scanTokenLifecycle(), contractSectionOrder(W), agentsVersionDrift(W));
const age = intelAge();

if (age !== null && age > MAX_AGE_DAYS) console.error('[时效提醒] docs/squad/intel 最老工件 ' + age + ' 天 —— 情报对标应在每次派活前复核，超过 ' + MAX_AGE_DAYS + ' 天视为过期。');

// ROUTES 一致性（数据治理共识）：AVAILABLE-ROUTES.md 与 routes.json 必须同步，漂移=红项。
try {
  const rjPath = join(W, 'docs/squad/gates/routes.json');
  const rmdPath = join(W, 'docs/squad/gates/AVAILABLE-ROUTES.md');
  if (existsSync(rjPath) && existsSync(rmdPath)) {
    const rj = JSON.parse(readFileSync(rjPath, 'utf8'));
    const allowed = new Set(); const dead = new Set();
    for (const line of readFileSync(rmdPath, 'utf8').split('\n')) {
      const m = line.match(/^\|\s*([a-z0-9-]+\/[^|\s]+)\s*\|/);
      if (!m) continue;
      if (line.includes('不可用')) dead.add(m[1]);
      else if (line.includes('可用') && !line.includes('不可用')) allowed.add(m[1]);
    }
    const mdAllowed = [...allowed].sort().join(',');
    const jsonAllowed = [...(rj.allowed || [])].sort().join(',');
    const mdDead = [...dead].sort().join(',');
    const jsonDead = [...(rj.dead || [])].sort().join(',');
    if (mdAllowed !== jsonAllowed || mdDead !== jsonDead) {
      problems.push('ROUTES 漂移：AVAILABLE-ROUTES.md 与 routes.json 不同步（md allowed=' + mdAllowed + ' json=' + jsonAllowed + '；md dead=' + mdDead + ' json=' + jsonDead + '）—— 更新任一侧后同步另一侧');
    }
  }
} catch (e) { problems.push('ROUTES 一致性检查失败: ' + e.message); }


// ── garden 扩容（1.17.0 · A4 依据 wshobson Quality gates「garden：孤儿/超长/陈旧」）──
// C) 孤儿：assets/skills/ 下技能目录未被 sop-inject 技能索引节提及（发布物孤儿）。
// D) 超长：docs/squad/prompts/*-v*.md >500 行（A4 超长阈值的门面）。
// E) 回程一致性：allowlist.scripts 列出的脚本文件必须在磁盘存在（清单-磁盘对账）。
function gardenChecks(problems) {
  // C 孤儿
  try {
    const skDir = join(W, 'packages/dsh-quanneng-squad/assets/skills');
    const im = readFileSync(join(W, 'packages/dsh-quanneng-squad/lib/index.js'), 'utf8');
    if (existsSync(skDir)) {
      for (const n of readdirSync(skDir)) {
        if (!im.includes('/' + n + '/') && !im.includes(n + '(')) problems.push('garden C 孤儿技能: assets/skills/' + n + ' 未被 sop-inject 技能索引引用');
      }
    }
  } catch (e) { problems.push('garden C 检查失败: ' + e.message); }
  // D 超长
  try {
    const pr = join(W, 'docs/squad/prompts');
    if (existsSync(pr)) for (const f of readdirSync(pr)) {
      if (!/-v\d+\.md$/.test(f)) continue;
      const n = readFileSync(join(pr, f), 'utf8').split('\n').length;
      if (n > 500) problems.push('garden D 超长提示词: docs/squad/prompts/' + f + ' ' + n + ' 行 > 500（渐进披露拆分）');
    }
  } catch (e) { problems.push('garden D 检查失败: ' + e.message); }
  // E 回程：allowlist.scripts ↔ 磁盘
  try {
    const alPath = join(W, 'packages/dsh-quanneng-squad/assets/PACKAGE-ALLOWLIST.json');
    if (existsSync(alPath)) {
      const al = JSON.parse(readFileSync(alPath, 'utf8'));
      for (const s of al.scripts || []) {
        if (!existsSync(join(W, 'packages/dsh-quanneng-squad/scripts', s))) problems.push('garden E 清单孤儿: allowlist.scripts/' + s + ' 磁盘不存在');
      }
    }
  } catch (e) { problems.push('garden E 检查失败: ' + e.message); }
}
gardenChecks(problems);

// 第3期重构：所有扫描（含 ROUTES）完成后统一走 gate-kit 输出/阻断，消除"ROUTES 漂移不进 JSON 不阻断"的隐藏缺陷。
const exitCode = runGate({
  name: NAME, varName: VAR, kind: '文件腐化', items: problems, W,
  report: {
    workspace: W, gate: NAME,
    pointersAlive: p1.alive, deadPointers: p1.problems.length,
    staleClaims: p2.length, intelOldestDays: age, intelFreshLimit: MAX_AGE_DAYS,
    problems: problems.slice(0, 40), truncated: problems.length > 40,
  },
});
failFast(exitCode);
