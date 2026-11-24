// dsh-quanneng-squad · 插件运行时入口（零编译、零外部依赖）
// 职责边界：
//   1) 插件标识 / squad 名册 / 默认配置 / 系统提示词 SOP 段落 + apply(ctx) 生命周期钩子
//   2) 业务能力一律 re-export 自 ./contract.js 等子模块 —— 本文件不再内联重复声明常量，
//      因为双份定义正是历史上「导出契约漂移」的根源（ZERO_IV 幽灵导出、createFileChannel 重复导出）。
//   3) 所有 re-export 名称由 scripts/sync-lib.mjs 在构建期对照子模块真实导出做校验。

export const name = 'dsh-quanneng-squad';
export const version = '1.20.0';

export const SQUAD_MEMBERS = [
  { name: '需求经理', preset: 'squad-arch', domain: '规划域' },
  { name: '产品经理', preset: 'squad-arch', domain: '规划域' },
  { name: '架构经理', preset: 'squad-arch', domain: '规划域' },
  { name: '前端经理', preset: 'squad-dev', domain: '实现域' },
  { name: '后端经理', preset: 'squad-dev', domain: '实现域' },
  { name: '御史大夫', preset: 'squad-court', domain: '监察', readonly: true },
  { name: '运维经理', preset: 'squad-ops', domain: '运维域' },
  { name: '交付发布经理', preset: 'squad-ops', domain: '运维域' },
  { name: '测试经理', preset: 'squad-qa', domain: '质量域' },
  { name: '给事中', preset: 'squad-court', domain: '门下省' },
  { name: '考功郎中', preset: 'squad-court', domain: '吏部' },
  { name: '起居注官', preset: 'squad-court', domain: '翰林' },
  { name: '采风官', preset: 'squad-court', domain: '谋断' },
  { name: '集贤学士', preset: 'squad-court', domain: '谋断' },
  { name: '翰林学士', preset: 'squad-court', domain: '谋断' },
  { name: '太傅', preset: 'squad-court', domain: '谋断' },
];

// 组织归属唯一真源：7 类 agent preset 全部归属小队指挥（squad-lead），构成全面智能组织。
export const SQUAD_PRESETS = [
  { id: 'squad-lead', name: '小队指挥（全能编程）', group: '指挥', commander: 'self', members: '全队 16 席' },
  { id: 'squad-arch', name: '小队·需求与架构', group: '规划域', commander: 'squad-lead', seats: ['需求经理','产品经理','架构经理'] },
  { id: 'squad-design', name: '小队·UI/UX 设计', group: '设计域', commander: 'squad-lead', seats: [], note: '预设常驻，当前 16 席无独立设计席；UI 评审由前端经理代行' },
  { id: 'squad-dev', name: '小队·开发工程师', group: '实现域', commander: 'squad-lead', seats: ['前端经理','后端经理'] },
  { id: 'squad-qa', name: '小队·质量与审计', group: '质量域', commander: 'squad-lead', seats: ['测试经理'] },
  { id: 'squad-ops', name: '小队·运维与交付', group: '运维域', commander: 'squad-lead', seats: ['运维经理','交付发布经理'] },
  { id: 'squad-court', name: '小队·朝廷治理岗', group: '监察谋断', commander: 'squad-lead', seats: ['御史大夫','给事中','考功郎中','起居注官','采风官','集贤学士','翰林学士','太傅'], note: '封驳/监察按宪法 C3 独立行使，编制与派活仍归指挥' },
];

export const DEFAULT_CONFIG = {
  maxMembers: 16,
  profileName: 'quanneng-16',
  stateDir: '.agent-teams',
  memberProvider: 'spawn',
  memberMaxDepth: 0,
};

export function squadUsageSection() {
  return [
    '## 全能编程小队（dsh-quanneng-squad v' + version + '）',
    '编制 16 人常驻；S-1~S9 每阶段 = 责任席位 + 必产物 + 出门门，缺产物即迭代未完成。',
    '【智能组织】7 类 preset（squad-lead / arch / design / dev / qa / ops / court）与 16 席全部归属小队指挥：指挥是唯一派活与验收源，六类成员预设不横向派活；详见 docs/squad/ORG-CHART.md。',
    '【每次派活前提·缺一无效】① 情报先行：复核 docs/squad/intel/ 约束清单，>7 天或代码已变而清单未变则先重扫；② 提示词现行版：squadRole 指向 docs/squad/prompts/<角色>-v<n>.md 最新版，INDEX.md 为真源；③ 派活令牌：任务书带 TK-<轮次>-<序号>，回报首行必含 token，无令牌 captain 不验收；④ 简报与脉搏：每轮收尾写 docs/squad/briefs/round-<N>.md（七段）+ 刷新 TEAM-PULSE.md；⑤ 记注对账：起居注官比对报称产出与实际落盘，跑 drift-check 防文件腐化。',
    '【技能索引（渐进披露 · 按需读 assets/skills/<n>/SKILL.md）】quickstart(新用户上手)/status(全貌)/upgrade(升级)/rollback(回滚)/gates(门禁)/pulse(脉搏)/l4(成熟度)/memory(记忆)/autopilot(自动编排)/diagnostics(症状路由)/obs-rank(活跃排行)/tokens(令牌状态机)——各技能 frontmatter 含 "Use when" 触发语，症状匹配再读全文，避免整册注入。',
    '【用户侧提示词】docs/squad/user-prompts/USER-ORIGINAL-PROMPT.md 是用户原话的结构化契约（U1~U9）；用户提需求先读它，把口语诉求映射到可执行验收，不要替用户省略。',
    '【结果验证】收口前跑 scripts/result-verify.mjs 做「规范→v0→v1→契约→实现」端到端覆盖核对；门禁绿 ≠ 任务结果对得上。',
    '【过程可见】每轮拆解与汇总用实时界面展示给用户，不能只在对话末尾贴长文。',
    '【记忆】DECISIONS.jsonl 为唯一权威（本地为主），Hindsight 云端仅辅助、不可达不影响结论。',
    '【五门】seat-utilization / audit-roster / reflow-check / stage-order / drift-check 默认阻断 + 带到期日豁免；模型变化由 audit-roster 跟随 profile 默认自动适配。',
    '【通道·subagent-first】派活主通道=主对话直接 subagent({description,prompt})，prompt 首行 squadRole 指向现行提示词并自带六要素；回报直接回主对话，无「激活≠驱动」两步。agent_teams/squads_run_member 降级为兼容通道，仅面板需要时可选。',
    'maxMembers=16 由 cordis.patch.yml 覆盖；成员回报 ≤40 行、消息只做指针；宪法层变更需用户批准。',
  ].join('\n');
}
/** Cordis-style lifecycle hook. Safe no-op when the host exposes no prompt-section registry. */
export function apply(ctx) {
  try {
    const section = { title: name, text: squadUsageSection(), order: 117 };
    if (ctx && typeof ctx.systemPrompt?.addSection === 'function') {
      ctx.systemPrompt.addSection(section);
      return { mounted: true, members: SQUAD_MEMBERS.length, config: DEFAULT_CONFIG };
    }
    if (ctx && typeof ctx.injectPromptSection === 'function') {
      ctx.injectPromptSection(section);
      return { mounted: true, members: SQUAD_MEMBERS.length, config: DEFAULT_CONFIG };
    }
  } catch (e) {
    return { mounted: false, reason: e.message, members: SQUAD_MEMBERS.length };
  }
  return { mounted: false, reason: 'no prompt-section API on host', members: SQUAD_MEMBERS.length };
}

// ── 业务契约（唯一真源：./contract.js）──
export {
  VERSION, BIZ, HEADERS, SUCCESS_CODES, SUB, CODE_REASON, GENERATORS, CATE_CODES,
  STATE, STORE_FORWARD, TIMEOUT, buildCanonical, idemKey, reqId, now14, now17, b64, unb64,
} from './contract.js';

// ── 国密与协议 ──
export { sm3, sm3Bytes } from './crypto/sm3.js';
export { sm4CbcEncrypt, sm4CbcDecrypt, sm4EncryptBlock, sm4DecryptBlock, expandKey, nativeSm4Available } from './crypto/sm4.js';
export { sm2Sign, sm2Verify, sm2Encrypt, sm2Decrypt, generateKeyPair, publicFromPrivate, scalarMul, pointAdd, isOnCurve, computeZA, digestE, publicKeyToHex, publicKeyFromHex, privateKeyToHex, privateKeyFromHex, P, A, B, N, G, GX, GY, inv } from './crypto/sm2.js';
export { createProvider } from './crypto/provider.js';
export { createAdapter } from './protocol/adapter.js';
export { normalizeResponse, normalizeSubCode } from './protocol/response.js';

// ── 内核：存储 / 状态机 / 对账 / 编排 ──
export { createMemoryStores, createFileStores } from './core/store.js';
export { transition, applyResponse, assertNoResend, EVENT } from './core/state.js';
export { createReconciler } from './core/reconcile.js';
export { createOrchestrator } from './core/orchestrator.js';

// ── 传输 / 服务 / 可观测 / 组装 ──
export { createUpstreamClient } from './transport/client.js';
export { createFileChannel } from './transport/filechannel.js';
export { createMetrics } from './observability/metrics.js';
export { createMockUp } from './mock/server.js';
export { createInbound } from './inbound/server.js';
export { createNorthServer } from './north/server.js';
export { loadConfig, ensureLocalKeys, DEFAULTS } from './config.js';
export { createGateway } from './gateway.js';

export default { name, version, SQUAD_MEMBERS, SQUAD_PRESETS, DEFAULT_CONFIG, squadUsageSection, apply };
