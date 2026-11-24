import { readDefaultModel } from './config-adapter.mjs';

// 模型建议层（1.18.0 · A5 依据 wshobson Model tiers + P15 红线）：
// tier 别名 → 用途建议表。任何输出都不得含 provider/model 字面量——
// 「建议跟随宿主」是唯一合法路由输出（P15：不锁死模型；ruflo Agent=Model+Harness 背书）。
// 本模块是纯建议层：不做任何路由写操作；钉死行为在 verify/gate 断言拦截。
export const TIERS = [
  { tier: 1, name: '深谋', useFor: '架构、安全审计、代码评审、生产实现', suggestion: '跟随宿主主模型（不钉死）' },
  { tier: 2, name: '精研', useFor: '复杂专项（AI/后端/领域专用）', suggestion: '跟随宿主主模型（不钉死）' },
  { tier: 3, name: '承务', useFor: '文档、测试、调试、支持', suggestion: '跟随宿主主模型（不钉死）' },
  { tier: 4, name: '轻捷', useFor: '快查、部署、简单任务', suggestion: '跟随宿主主模型（不钉死）' },
];

// 按席位性质给建议（只读席→轻；实现席→深谋）。输出仅含建议语，无任何模型字面量。
const SEAT_TIER = {
  '御史大夫': 1, '给事中': 1, '架构经理': 1, '后端经理': 1, '前端经理': 1,
  '测试经理': 3, '考功郎中': 3, '起居注官': 3, '需求经理': 3, '产品经理': 3,
  '运维经理': 4, '交付发布经理': 4, '采风官': 4, '集贤学士': 2, '翰林学士': 2, '太傅': 3,
};
export function suggestForSeat(seat) {
  const t = SEAT_TIER[seat] || 2;
  const tier = TIERS.find(x => x.tier === t);
  return { seat, tier: t, name: tier.name, useFor: tier.useFor, suggestion: tier.suggestion };
}
export function suggestAll(seats) {
  const current = (() => { try { return readDefaultModel(); } catch { return null; } })();
  return { routingNote: 'P15：路由永远跟随宿主当前默认（' + (current ? '已实读 profile' : 'profile 不可读') + '），本层只给用途建议', suggestions: (seats || []).map(suggestForSeat) };
}
