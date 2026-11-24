import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { W } from './gate-kit.mjs';

// dispatch 计划生成（一期 1.15.0 · B6 对齐 sandcastle 编排原语）：
// createDispatchPlan({round,w,seats,cards}) → {round,w,jobs[],missingCards[]} 机器可读返回。
// 对照 sandcastle：run({agent,sandbox,promptFile}) → {iterations,commits,branch}——
// 「调用返回结果」而非「副作用+打印」；provider 可插拔映射：消息通道=subagent 主通道（agent_teams 兼容通道不再写入消息体）。
// 从 squad-autopilot.mjs --dispatch 机械抽出（零行为变化），CLI 薄壳调用本函数。

// 席位→写域（FUNCTION-LEDGER 实读）。
export function domainOfSeat(ledgerPath) {
  const domainOf = {};
  if (existsSync(ledgerPath)) {
    for (const l of readFileSync(ledgerPath, 'utf8').split('\n')) {
      const c = l.split('|').map(s => s.trim());
      if (c.length > 4 && c[1] && c[1] !== '席位' && c[1] !== '---') {
        const m = c[3].match(/[\w./\-]+\//);
        domainOf[c[1]] = m ? m[0] : c[3].split(/[+,]/)[0].trim();
      }
    }
  }
  return domainOf;
}

// 卡片六要素提取：兼容「| 目标 | xxx |」表格行与「目标：xxx」行式两种形态；取不到=卡未派活（诚实标注）。
function pick(cardText, label) {
  const row = cardText.match(new RegExp('\\|\\s*' + label + '\\s*\\|\\s*([^|\\n]+)\\|'));
  if (row) return row[1].trim();
  const line = cardText.match(new RegExp(label + '[：:]\\s*([^\\n]+)'));
  return line ? line[1].trim() : '';
}


// 派单清洗（1.18.0 · 依据 edict「旨意数据清洗」）：消息体入清——
// 剥离文件路径泄漏/元数据噪音/无效前缀/占位转述（「见卡」「待派」类空话不得进真实任务消息）。
export function sanitizeMessage(msg) {
  if (typeof msg !== 'string') return '';
  return msg
    .replace(/^[\s\-—>·]+/, '')            // 无效前缀
    .replace(/[\u200b\u200e\ufeff]/g, '') // 零宽/方向字符
    .replace(/\bTK-ROUND-NNN\b/g, '')       // 占位令牌残留
    .replace(/(见任务书|见卡|待填充|待派)(?=[。，,;；\n]|$)/g, '') // 占位转述
    .replace(/\n{3,}/g, '\n\n')            // 空行压缩
    .replace(/[ \t]+$/gm, '')               // 行尾空白
    .trim();
}

// 主接口：生成派单计划。seats=轮转名册简称数组；cards=dispatch 目录卡片名（无 .md 后缀）数组。
export function createDispatchPlan({ round, w, seats, cards, ws } = {}) {
  const root = ws || W;
  const dsp = join(root, 'docs/squad/dispatch');
  const cardList = cards || (existsSync(dsp) ? readdirSync(dsp).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : []);
  const domainOf = domainOfSeat(join(root, 'docs/squad/FUNCTION-LEDGER.md'));
  // 简称→卡片文件名（dispatch 目录实读，前缀匹配）。
  const cardOf = abbr => {
    const short = abbr.replace(/(经理|官|学士|大夫|郎中)$/, '');
    return cardList.find(c => c.startsWith(abbr) || c.startsWith(short)) || null;
  };
  const jobs = [];
  const missingCards = [];
  for (const abbr of seats || []) {
    const card = cardOf(abbr);
    if (!card) { missingCards.push(abbr); continue; }
    const cardPath = join(dsp, card + '.md');
    const cardText = readFileSync(cardPath, 'utf8');
    const goal = pick(cardText, '目标') || pick(cardText, '任务目标');
    const isDeliverable = !!goal && !/待派|待填充|见卡/.test(goal);
    const cardAgeDays = Math.floor((Date.now() - statSync(cardPath).mtimeMs) / 86400000);
    const domain = (Object.entries(domainOf).find(([k]) => k === abbr || k.startsWith(abbr) || abbr.startsWith(k.replace(/(经理|官|学士|大夫|郎中)$/, ''))) || [,'(未知写域，需人工核对)'])[1];
    // S4-3（1.18.0）：工作量预估 S/M/L——卡上「工作量」行优先；缺省按验收+目标文本量启发（诚实标注 inferred）。
    const effortRaw = pick(cardText, '工作量') || pick(cardText, '预估');
    const effort = /^[SsMmLl]$/.test(effortRaw.trim()) ? effortRaw.trim().toUpperCase()
      : ((goal.length + (pick(cardText, '验收') || '').length) > 120 ? 'L' : (goal.length > 40 ? 'M' : 'S'));
    const effortInferred = !/^[SsMmLl]$/.test(effortRaw.trim());
    // 通道统一（一期主目标）：回报=主对话直回+落盘 inbox 留痕；旧队内消息通道措辞全部退役（1.15.0）。
    jobs.push({
      seat: abbr, token: null /* 由调用方按 9xx 段填 */, card, cardPath: 'docs/squad/dispatch/' + card + '.md',
      cardAgeDays, domain, deliverable: isDeliverable,
      goal: goal || '(卡未派活——轮转确认令牌，待正式故事卡)',
      effort, effortInferred,
      artifacts: pick(cardText, '必产物') || pick(cardText, '产物') || pick(cardText, '回报落盘') || '(见卡)',
      acceptance: pick(cardText, '验收') || pick(cardText, '验收标准') || '(见卡)',
      message: sanitizeMessage(isDeliverable
        ? 'squadRole: docs/squad/prompts/' + abbr + '-v<n>.md（以 INDEX.md 现行版为准）\n任务书 ' + 'TK-ROUND-NNN' + '（第' + round + '轮 ' + w + ' 名册）。目标：' + goal +
          '。必产物：' + (pick(cardText, '必产物') || '(见卡)') + '。写域：' + domain + '。验收：' + (pick(cardText, '验收') || '(见卡)') +
          '。卡龄 ' + cardAgeDays + ' 天（>7 天先复核情报再动手，AGENTS §4 情报先行）。开工第一动作：读 docs/squad/pipeline/DELIVERY-PIPELINE.md 与本卡全文 docs/squad/dispatch/' + card + '.md' +
          '；回报首行含 token: TK-ROUND-NNN，回报直接回主对话并落盘 docs/squad/inbox/' + card + '.md（留痕）。'
        : '轮转确认 TK-ROUND-NNN（第' + round + '轮 ' + w + ' 名册）：确认在岗与回报通道可达，回报直接回主对话（"in place"即可）；本令牌非交付令牌，正式任务书随后由指挥下达（subagent-first：回报回主对话，inbox 仅留痕）。'),
    });
  }
  // G4（1.20.0）：并行投递安全元——写域互斥由 dispatch-guard 保证（同一计划内 jobs 两两无重叠写域时
  // 才可并发 subagent；保守并发=C2 上限 3）。captain 按 batch 投递：safe 时可 Promise.all，否则分批。
  const overlap = (a, b) => { const x = String(a).replace(/\/+$/, ''), y = String(b).replace(/\/+$/, '');
    return x === y || x.startsWith(y + '/') || y.startsWith(x + '/'); };
  const domains = jobs.map(j => j.domain).filter(d => d && d !== '(未知写域，需人工核对)');
  const pairwiseSafe = domains.every((a, i) => domains.every((b, j) => i === j || !overlap(a, b)));
  return { round, w, jobs, missingCards,
    concurrency: { safe: pairwiseSafe, recommended: pairwiseSafe ? Math.min(3, jobs.length) : 1,
      note: 'C2 并发≤3；写域互斥由 dispatch-guard 门保证；保守=逐条投递' } };
}
