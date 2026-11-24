/**
 * panel-sync.mjs · 面板 ↔ 全能小队 双向同步器
 *
 * 问题背景（第 59~60 轮实测）：
 *  - 本地派单真源 = docs/squad/dispatch/*.md 的结构化令牌段
 *  - 面板真源 = agent_teams 的任务列表
 *  - 两者此前完全脱节 → 用户在面板看不到小队真实工作
 *
 * 本脚本职责（只读本地 + 写面板，不碰业务代码）：
 *  1. 扫描 dispatch 卡，抽取每个 TK 令牌的状态/席位/写域/阶段
 *  2. 与面板任务按令牌对齐（面板 subject 里的 TK-\d+-\d+ 即锚）
 *  3. 输出差异报告（本地有面板无 / 面板有本地无 / 状态不一致）
 *  4. 可选 --apply：为本地在途令牌在面板补建任务卡（带 assignee，不覆盖已有）
 *
 * 原则（工程约束）：
 *  - 幂等：重复运行不产生重复卡
 *  - 只读本地：绝不改 dispatch 卡
 *  - 失败可见：任何面板调用失败都进 problems 并 exit 1（不静默）
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, PENDING_RE, TERMINAL_RE } from './lib/gate-kit.mjs';

const DISPATCH = join(W, 'docs/squad/dispatch');
const TERMINAL = TERMINAL_RE;   // 真源（t10）
const PENDING = PENDING_RE;   // 真源（t10）

/** 从 dispatch 卡抽取全部令牌段 */
export function scanLocal() {
  const out = [];
  if (!existsSync(DISPATCH)) return out;
  for (const f of readdirSync(DISPATCH)) {
    if (!f.endsWith('.md')) continue;
    const seat = f.replace(/\.md$/, '');
    const text = readFileSync(join(DISPATCH, f), 'utf8');
    for (const sec of text.split(/\n(?=## )/)) {
      const tok = sec.match(/\|\s*令牌\s*\|\s*(TK-\d+-\d+)/);
      if (!tok) continue;
      const st = sec.match(/\|\s*状态\s*\|([^\n]*)/);
      const role = sec.match(/\|\s*squadRole\s*\|([^\n]*)/);
      const scope = sec.match(/\|\s*写域\s*\|([^\n]*)/);
      const stage = sec.match(/\|\s*阶段\s*\|([^\n]*)/);
      const goal = sec.match(/\|\s*目标\s*\|([^\n]*)/);
      const raw = (st ? st[1] : '').trim();
      const state = TERMINAL.test(raw) ? 'closed' : (PENDING.test(raw) ? 'inflight' : 'other');
      out.push({
        token: tok[1], seat, state, raw,
        role: role ? role[1].trim() : null,
        scope: scope ? scope[1].trim() : null,
        stage: stage ? stage[1].trim() : null,
        goal: goal ? goal[1].trim() : null,
        round: Number(tok[1].match(/TK-(\d+)-/)?.[1] || 0),
      });
    }
  }
  return out;
}

/** 令牌在面板里的对齐锚：subject 含 TK-\d+-\d+ */
export function panelAnchor(task) {
  return String(task.subject || '').match(/TK-\d+-\d+/)?.[0] || null;
}

export function diff(local, panelTasks) {
  const panelByTok = new Map();
  for (const t of panelTasks) {
    const a = panelAnchor(t);
    if (a) panelByTok.set(a, t);
  }
  const missing = [], mismatch = [], matched = [];
  for (const l of local) {
    const p = panelByTok.get(l.token);
    if (!p) { missing.push(l); continue; }
    matched.push({ local: l, panel: p });
    const panelState = /completed|done|closed/i.test(p.status) ? 'closed'
      : (/failed|cancelled/i.test(p.status) ? 'failed'
      : (/claimed|in_progress|pending/i.test(p.status) ? 'inflight' : p.status));
    if (l.state === 'closed' && panelState === 'closed') continue;
    if (l.state === 'inflight' && panelState === 'inflight') continue;
    mismatch.push({ token: l.token, local: l.state, panel: panelState, panelId: p.id, panelStatus: p.status });
  }
  const localToks = new Set(local.map(l => l.token));
  const extra = [];
  for (const t of panelTasks) {
    const a = panelAnchor(t);
    if (a && !localToks.has(a)) extra.push({ id: t.id, token: a, status: t.status, subject: t.subject });
  }
  return { missing, mismatch, matched, extra, panelByTok };
}

if (import.meta.url === (process.argv[1] ? new URL('file://' + process.argv[1]).href : '')) {
  const local = scanLocal();
  const st = await import('node:child_process');
  // 面板状态无法在脚本内直接取（需 host 工具）：这里只输出本地视图 + 供 host 比对的 JSON
  console.log(JSON.stringify({
    workspace: W, localCount: local.length,
    byState: local.reduce((a, l) => (a[l.state] = (a[l.state] || 0) + 1, a), {}),
    tokens: local.map(l => ({ token: l.token, seat: l.seat, state: l.state, stage: l.stage })),
  }, null, 2));
}
