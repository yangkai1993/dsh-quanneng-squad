// 小队常量真源（第1期重构）：SQUAD_ID/编制/阶段号收敛到一处，消费方 env 覆盖仍保留。
// DRY：此前 SQUAD_ID 在 audit-roster/sync-seat-model 各写一遍字面量。
export const SQUAD_ID = process.env.QUANNENG_SQUAD_ID ?? 'baa0a893-bda5-409b-840b-07a45cdcf290';
export const SQUAD_NAME = 'quanneng-squad';
export const MAX_MEMBERS = 16;
export const MEMBER_MAX_DEPTH = 0;
// S-1~S9 阶段号表（DELIVERY-PIPELINE.md 的机器可读镜像；管线文档为叙述真源）
export const STAGES = ['S-1','S0','S1','S2','S3','S4','S5','S6','S7','S8','S9'];
export const STAGE_ARTIFACTS = {
  'S-1': 'docs/prd/clarifications',
  'S0':  'docs/squad/dispatch',
  'S1':  'docs/prd',
  'S2':  'docs/arch',
  'S3':  'docs/arch/api-contract.md',
  'S4':  'stories/',
  'S5':  'docs/qa',
  'S6':  'docs/squad/gates',
  'S7':  'deploy/',
  'S8':  'CHANGELOG.md',
  'S9':  'docs/squad/retro',
};
