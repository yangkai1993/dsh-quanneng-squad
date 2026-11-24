import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// 提示词静态评分快照（二期 1.16.0 · A1 依据 wshobson/agents evals snapshot-digest 模式 + B7 纯静态层）：
// ① 每个 <角色>-v<n>.md 按四维静态评分：P 内化覆盖 / 结构四节 / 长度合理 / 行数密度。
// ② score-snapshot.json 按内容 sha256 键控：改内容 → digest 变 → 该条自动跳过（改版永不误红）；
//    不改的技能 digest 不变 → 分数必须与快照一致（评分代码变了就红）——防误红+防漏检双解。
// ③ LLM judge 明确不做（B7/evalite 教训：评测器不自研重维护）。
// QUANNENG_ALLOW_PROMPT_SCORE_GAP 豁免（EXEMPTIONS 流程）。

const PROMPTS_DIR = join(W, 'docs/squad/prompts');
const SNAPSHOT = join(W, 'docs/squad/pipeline/prompt-score-snapshot.json');

// 单文件四维评分（纯函数）。
export function scorePrompt(text) {
  const lines = text.split('\n').filter(Boolean);
  const pMarks = (text.match(/\[P\d+\]/g) || []).length;
  const sections = ['验收口径', '出门门', 'G-REFLOW', '差异'].map(k => text.includes(k));
  const length = lines.length;
  // 长度分档：<60 行=偏薄(0.5)；60~500=合理(1)；>500=超长(0.7)（A4 garden 超长阈值的评分面体现）
  const lengthScore = length < 60 ? 0.5 : length <= 500 ? 1 : 0.7;
  const structScore = sections.filter(Boolean).length / sections.length;
  const pScore = Math.min(1, pMarks / 8); // ≥8 处 P 标记=满分（qa/security v6/v7 实测 12+）
  const total = +(pScore * 0.4 + structScore * 0.3 + lengthScore * 0.3).toFixed(3);
  return { pMarks, sections, length, pScore, structScore, lengthScore, total };
}

// 全量评分 + 快照对账。返回 {scores, stale, digestMoves}。
export function scoreAll() {
  const idxPath = join(PROMPTS_DIR, 'INDEX.md');
  const index = existsSync(idxPath) ? readFileSync(idxPath, 'utf8') : '';
  const files = existsSync(PROMPTS_DIR) ? readdirSync(PROMPTS_DIR).filter(f => /-v\d+\.md$/.test(f)) : [];
  const snap = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, 'utf8')) : { entries: {} };
  const scores = [], stale = [], digestMoves = [];
  for (const f of files) {
    const text = readFileSync(join(PROMPTS_DIR, f), 'utf8');
    const digest = createHash('sha256').update(text).digest('hex').slice(0, 16);
    const s = scorePrompt(text);
    const inIndex = index.includes(f);
    const prev = snap.entries?.[f];
    if (prev && prev.digest !== digest) { digestMoves.push(f); } // 改版→自动跳过对账
    else if (prev && prev.digest === digest && prev.score !== s.total) { stale.push(f + ' 分数漂移 ' + prev.score + '→' + s.total); }
    scores.push({ file: f, digest, inIndex, ...s });
  }
  return { scores, stale, digestMoves };
}

// 门入口：两类问题=①digest 未变的文件分数漂移（评分代码被改）②现行版不在 INDEX（指针失效）。
// 注意：改版文件（digestMoves）自动豁免——先跑本脚本更新快照再过门（snapshot-digest 模式）。
export function checkPromptScore() {
  const { scores, stale } = scoreAll();
  const problems = [];
  for (const p of stale) problems.push('评分漂移(未改内容分数变了=评分代码被动过): ' + p);
  // 指针检查只对现行版（INDEX 主表引用的文件）；历史旧版是版本化工件，INDEX 本就不该引用。
  const current = scores.filter(s => s.inIndex);
  if (current.length === 0) problems.push('INDEX.md 未引用任何版本文件（现行版指针表为空）');
  const gate = runGate({ name: 'prompt-score', varName: 'QUANNENG_ALLOW_PROMPT_SCORE_GAP',
    kind: '提示词评分缺口: ' + problems.join('；'), items: problems, W,
    report: { workspace: W, files: scores.length, avg: scores.length ? +(scores.reduce((a, s) => a + s.total, 0) / scores.length).toFixed(3) : 0,
      problems, snapshot: SNAPSHOT, scores } });
  failFast(gate);
  return { exit: gate, files: scores.length, problems };
}

// 快照刷新（显式命令）：node scripts/prompt-score.mjs --update-snapshot
export function updateSnapshot() {
  const { scores, digestMoves } = scoreAll();
  const entries = {};
  for (const s of scores) entries[s.file] = { digest: s.digest, score: s.total, pMarks: s.pMarks, length: s.length };
  writeFileSync(SNAPSHOT, JSON.stringify({ updatedAt: new Date().toISOString(), entries }, null, 2) + '\n', 'utf8');
  return { updated: scores.length, digestMoves };
}

// CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  if (process.argv.includes('--update-snapshot')) console.log(JSON.stringify(updateSnapshot(), null, 2));
  else { const r = checkPromptScore(); console.log(JSON.stringify(r, null, 2)); }
}
