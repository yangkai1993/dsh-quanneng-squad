// 第2期重构：本模块由 verify.mjs 机械拆分而来（断言内容逐字保留，零语义变化）。
// ctx = { t, root, readFileSync, existsSync, join, spawnSync, pathToFileURL, tmpdir, mkdtempSync, mkdirSync, writeFileSync, rmSync, pkg, patch, buildPatchText }
export function run(ctx) {
  const { t, root, readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, spawnSync, pathToFileURL, tmpdir, join, dirname, workspace, pkg, patch, buildPatchText } = ctx;
  return (async () => {
t('package.json declares dsh.bundle.patch', () => pkg().dsh?.bundle?.patch === './cordis.patch.yml');
t('lib/index.js exists and is ESM', () => existsSync(join(root,'lib/index.js')) && pkg().type === 'module');
t('7 agent presets declared', () => (patch().match(/^\s*- id: preset-squad-/gm)||[]).length === 7);
t('7 preset ids present', () => ['squad-lead','squad-arch','squad-design','squad-dev','squad-qa','squad-ops','squad-court'].every(i => patch().includes('id: '+i)));
t('maxMembers = 16', () => /maxMembers:\s*16/.test(patch()));
t('quanneng-16 profile present', () => /quanneng-16:/.test(patch()));
t('profile has exactly 16 members', () => { const b = patch().slice(patch().indexOf('quanneng-16:')); return (b.match(/^\s+- name: /gm)||[]).length === 16; });
t('no undeclared tool_policy', () => !/tool_policy:/.test(patch()));
t('memberMaxDepth 0', () => /memberMaxDepth:\s*0/.test(patch()));
t('assets manifest valid', () => { const m = JSON.parse(readFileSync(join(root,'assets/MANIFEST.json'),'utf8')); return m.docs.length >= 10 && m.dirs.length >= 8; });
t('README files exist', () => existsSync(join(root,'README.md')) && existsSync(join(root,'README_ZH.md')));
t('compatibility.json exists', () => existsSync(join(root,'compatibility.json')));
await t('apply(ctx) mounts SOP section', async () => {
  const m = await import(pathToFileURL(join(root,'lib/index.js')).href);
  const ctx = { systemPrompt: { addSection: (x) => { ctx._got = x; } } };
  const r = m.apply(ctx);
  return r.mounted === true && ctx._got?.text === m.squadUsageSection() && r.members === 16;
});
await t('cordis.patch.yml is generated from canonical sources', () => {
  // 第1期重构：字节级自检闭环——用 patch-sync 纯函数重算，与落盘文件逐字节对比（不再子串包含）
  return buildPatchText(root) === patch();
});
await t('doctor has no hardcoded user path', () => !readFileSync(join(root,'scripts/doctor.mjs'),'utf8').includes('C:/Users/ASUS'));
await t('install.mjs present', () => existsSync(join(root,'scripts/install.mjs')));
await t('无 pnpm 拦截的生命周期脚本（install/postinstall/preinstall/prepare 全缺）', () => {
  const s = pkg().scripts || {};
  return ['install','postinstall','preinstall','prepare'].every(k => !(k in s));
});
await t('bundle 包内无 pnpm 配置（构建策略属 profile 根，非依赖包）', () => {
  return !('pnpm' in pkg());
});
await t('全能小队不限制任何模型：真源无白名单/黑名单/provider拒，bundle 无钉定', () => {
  const routes = JSON.parse(readFileSync(join(workspace,'docs/squad/gates/routes.json'),'utf8'));
  const canon = readFileSync(join(root,'assets/canonical/team-overrides.yml'),'utf8');
  const m = canon.match(/provider:\s*(\S+)[\s\S]*?model:\s*(\S+)/);
  return (routes.allowed||[]).length === 0
    && (routes.dead||[]).length === 0
    && (routes.deadProviders||[]).length === 0
    && !m; // bundle 不写死任何 provider/model，跟随宿主 profile 当前路由
});
await t('派单路由不锁死：名册快照不钉 model + dispatch-guard 动态跟随 profile', () => {
  const snap = JSON.parse(readFileSync(join(root,'assets/roster-snapshot.json'),'utf8'));
  const seats = snap.seats || [];
  const pinned = seats.filter(s => s.model && String(s.model).length > 0);
  if (pinned.length) return false;
  const dg = readFileSync(join(root,'scripts/dispatch-guard.mjs'),'utf8');
  return dg.includes('currentProfileRoute') && dg.includes('agent-default-model');
});
await t('席位跟随主模型：sync-seat-model 清 pin（不写模型字面量）+ dispatch-guard/install 接入', () => {
  const ssm = readFileSync(join(root,'scripts/sync-seat-model.mjs'),'utf8');
  const dg = readFileSync(join(root,'scripts/dispatch-guard.mjs'),'utf8');
  const ins = readFileSync(join(root,'scripts/install.mjs'),'utf8');
  // 正确语义：清 pin（delete member.model）而非 pin 主模型字面量——pin 会把切换时刻的模型锁死到席位
  const dynamic = ssm.includes('syncSeatModels') && /delete member\.model/.test(ssm)
    && !/member\.model\s*=[^=]/.test(ssm)   // 不允许任何"member.model = <值>"的 pin 写入（==/=== 比较不算）
    && !/(buddy|glm-5|our-free-model|nemotron|qfmodel|deepseek-chat)/i.test(ssm); // 无模型字面量
  const wired = dg.includes('syncSeatModels') && ins.includes('syncSeatModels');
  return dynamic && wired;
});
await t('智能组织闭环：autopilot dispatch/collect 模式在位 + squadctl 接线 + 诚实语义', () => {
  const ap = readFileSync(join(root,'scripts/squad-autopilot.mjs'),'utf8');
  const ctl = readFileSync(join(root,'scripts/squadctl.mjs'),'utf8');
  // dispatch：薄壳调 createDispatchPlan（1.15.0 职责移 lib/dispatch-plan.mjs）；只产出计划不直接调宿主工具；卡龄时效在 lib 层
  const dp = readFileSync(join(root,'scripts/lib/dispatch-plan.mjs'),'utf8');
  const dispatch = ap.includes('--dispatch') && /不直接调宿主工具|CLI 只做/.test(ap) && dp.includes('cardAgeDays') && ap.includes('createDispatchPlan');
  // collect：事件源五态（reported/accepted/dispatched/inbox-only/planned-or-silent）不伪造验收结论（1.15.0 通道统一）
  const collect = ap.includes("--collect") && ap.includes("'reported'") && ap.includes("'inbox-only'") && ap.includes("'planned-or-silent'");
  return dispatch && collect && ctl.includes('autopilot:dispatch') && ctl.includes('autopilot:collect');
});
await t('配置适配层：config-adapter 存在且被所有配置消费方接入（适应不同 profile/模型形态）', () => {
  const ca = readFileSync(join(root,'scripts/lib/config-adapter.mjs'),'utf8');
  const consumers = ['audit-roster.mjs','dispatch-guard.mjs','route-health.mjs','install.mjs','doctor.mjs','pnpm-health.mjs','sync-seat-model.mjs'];
  const wired = consumers.every(f => {
    const s = readFileSync(join(root,'scripts',f),'utf8');
    return s.includes('config-adapter.mjs');
  });
  // 适配层本身：扫描 profile（非硬编码桌面只）、逐行切块（非脆弱正则）、空配置识别
  const robust = ca.includes('resolveProfileDir') && ca.includes('readdirSync(PROFILES_ROOT')
    && ca.includes('sliceBlock') && /\.split\(\/\\r\?\\n\//.test(ca) && ca.includes('MODEL_BLOCK_ID');
  return wired && robust;
});
await t('L5 可观测层：hub/telemetry/diagnostics 组件接线（hub 聚合五源+JSONL 回放+症状路由）', () => {
  const ob = join(root,'scripts/observability');
  const hub = readFileSync(join(ob,'hub.mjs'),'utf8');
  const tel = readFileSync(join(ob,'telemetry.mjs'),'utf8');
  const dia = readFileSync(join(ob,'diagnostics.mjs'),'utf8');
  return hub.includes('export function hub') && hub.includes('doctor.mjs') && hub.includes('supervise')
    && tel.includes('export function record') && tel.includes('export function replay') && tel.includes('.jsonl')
    && dia.includes('export function diagnostics') && dia.includes('ROUTES');
});
await t('L3 体验层：quickstart/status/light-mode/templates 组件接线', () => {
  const ux = join(root,'scripts/ux');
  if (!existsSync(join(ux,'quickstart.mjs'))) return false;
  if (!existsSync(join(ux,'status.mjs'))) return false;
  if (!existsSync(join(ux,'light-mode.mjs'))) return false;
  if (!existsSync(join(root,'assets/ux-templates.json'))) return false;
  const tpls = JSON.parse(readFileSync(join(root,'assets/ux-templates.json'),'utf8'));
  return (tpls.templates||[]).length >= 5;
});
await t('L2 cold-start-smoke 组件：隔离 profile 装/诊/卸 + release 接线', () => {
  const sm = readFileSync(join(root,'scripts/delivery/cold-start-smoke.mjs'),'utf8');
  const rel = readFileSync(join(root,'package.json'),'utf8');
  const rd = readFileSync(join(root,'README.md'),'utf8');
  return sm.includes('export function smoke') && sm.includes('mkdtempSync') && sm.includes('DSH_PROFILE_DIR')
    && /cold-start-smoke\.mjs/.test(rel)
    && rd.includes('Quick Start') && rd.includes('故障排查') && !rd.includes('C:/Users/ASUS');
});
await t('L2 upgrade/rollback 生命周期：lifecycle/upgrade/rollback 组件接线 + N=5 滚动备份', () => {
  const lc = readFileSync(join(root,'scripts/delivery/lifecycle.mjs'),'utf8');
  const ug = readFileSync(join(root,'scripts/delivery/upgrade.mjs'),'utf8');
  const rb = readFileSync(join(root,'scripts/delivery/rollback.mjs'),'utf8');
  return lc.includes('createBackup') && lc.includes('restoreBackup') && lc.includes('MAX_BACKUPS = 5')
    && ug.includes('export function upgrade') && ug.includes('autoRollback')
    && rb.includes('export function rollback') && rb.includes('checkDoctor');
});
await t('L2 doctor 三态组件：checkDoctor 纯函数 + 7类探测 + exit0/1/2', () => {
  const ds = readFileSync(join(root,'scripts/doctor.mjs'),'utf8');
  return ds.includes('export function checkDoctor') && ds.includes('incompatible')
    && ds.includes('degraded') && /process\.exit\(report\.level ===/.test(ds)
    && ["node-version","dsh-version","patch-structure","patch-source","exemptions","pack-clean"].every(k => ds.includes(k));
});
await t('R2 版本纪律：SEMVER.md 在位 + CHANGELOG 版本降序 + breakingChanges 补记', () => {
  if (!existsSync(join(root,'SEMVER.md'))) return false;
  const comp = JSON.parse(readFileSync(join(root,'compatibility.json'),'utf8'));
  if (!comp.breakingChanges?.length) return false;
  // CHANGELOG 版本降序检查
  const c = readFileSync(join(root,'CHANGELOG.md'),'utf8');
  const vers = [...c.matchAll(/^## \[(\d+)\.(\d+)\.(\d+)\]/gm)].map(m => Number(m[1])*10000 + Number(m[2])*100 + Number(m[3]));
  return vers.length >= 29 && vers.every((v,i) => i === 0 || vers[i-1] >= v);
});
await t('R1 发布卫生：npm files 白名单收口 + LICENSE 落地 + 无仓库污染', () => {
  const pj = JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  // files 收口：不得含裸 "assets"
  if (pj.files.includes('assets')) return false;
  // LICENSE 文件存在
  if (!existsSync(join(root,'LICENSE'))) return false;
  // 污染目录/文件不存在
  if (existsSync(join(root,'%SystemDrive%'))) return false;
  // npm pack 清单与 pack.mjs 白名单一致性由 release 链的 pack --check 承担（npm 调用慢，verify 不起子进程）
  return true;
});
await t('L2 pack 发布洁净度：白名单/黑名单在位 + pack 组件接线', () => {
  const allowPath = join(root,'assets/PACKAGE-ALLOWLIST.json');
  const denyPath = join(root,'assets/PACKAGE-DENY.json');
  if (!existsSync(allowPath) || !existsSync(denyPath)) return false;
  const allow = JSON.parse(readFileSync(allowPath,'utf8'));
  const deny = JSON.parse(readFileSync(denyPath,'utf8'));
  const packSrc = readFileSync(join(root,'scripts/delivery/pack.mjs'),'utf8');
  return allow.files?.length > 0 && allow.scripts?.length > 0 && deny.patterns?.length > 0
    && packSrc.includes('buildDist') && packSrc.includes('denylistHit') && packSrc.includes('--check');
});
await t('pnpm 构建批准健康：lock/workspace/ignoredBuilds 无本插件待决', async () => {
  const m = await import('../../pnpm-health.mjs');
  const r = m.checkPnpmHealth();
  if (!r.ok) throw new Error(JSON.stringify(r.failed));
  return true;
});
await t('CHANGELOG.md present', () => existsSync(join(root,'CHANGELOG.md')));
await t('local memory DECISIONS.jsonl exists and has >=10 decisions', () => {
  const p = join(workspace,'docs/squad/memory/DECISIONS.jsonl');
  return existsSync(p) && readFileSync(p,'utf8').split('\n').filter(Boolean).length >= 10;
});
await t('memory.mjs CLI present', () => existsSync(join(root,'scripts/memory.mjs')));
  })();
}
