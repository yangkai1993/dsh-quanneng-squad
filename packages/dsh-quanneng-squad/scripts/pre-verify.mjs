import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// PRE-VERIFY（四专家共识落地：工程师/治理）：
// 面板 completed 的 implementation/repair 卡若 changedPaths 含 *.java 或 pom.xml，
// 其 commandsRun 必须存在一条 `mvn ... test` 且 exitCode===0 的记录，
// 且该记录的证据时间戳（取任务完成时间）晚于被改文件的最大 mtime —— 否则 fail-closed。
// 这是行为断言：验证的是 mvn 真的跑过且通过，不是文档里写了 mvn。

const problems = [];
let scannedJavaCards = 0;
const RD = join(W, 'gateway-java/target/surefire-reports');
const RD_EXISTS = existsSync(RD);
function newestSurefireBatch() {
  if (!RD_EXISTS) return 0;
  let mx = 0;
  for (const f of readdirSync(RD)) { if (!f.endsWith('.txt')) continue; const s = statSync(join(RD, f)); if (s.mtimeMs > mx) mx = s.mtimeMs; }
  return mx;
}
const tjPath = join(W, '.agent-teams/quanneng-squad/team.json');
if (!existsSync(tjPath)) { problems.push('team.json 不存在（面板未挂载）'); }
let tasks = [];
try { tasks = (JSON.parse(readFileSync(tjPath,'utf8')).tasks || []); } catch (e) { problems.push('team.json 解析失败: ' + e.message); }

// PV-4：排除 test-compile/test-verify 混关；PV-5：取「最后一条 mvn 记录」的 exitCode（any→latest）。
for (const t of tasks) {
  if (t.status !== 'completed') continue;
  // F1 修复（TK-68-05）：不按 kind 过滤——completed 卡 changedPaths 含 .java/pom.xml 一律核证据。
  const javaPaths = (t.changedPaths || []).filter(p => /\.java$|pom\.xml$/.test(p));
  if (javaPaths.length === 0) continue;
  scannedJavaCards++;
  const cmds = t.commandsRun || [];
  const MVN_RE2 = /\bmvn\b[^&|;]*[\s"']-?(o\s+)?-?B?(\s+-?\w+)*\s+test(\s|$|"|')/i;
  const isMvnTest = (cmd) => /\bmvn\b/i.test(cmd) && /\btest\b(?![-\w])/.test(cmd) && !/test-(compile|verify|package)/.test(cmd);
  const mvnSeq = cmds.filter(c => isMvnTest(c.command || ''));
  const last = mvnSeq[mvnSeq.length - 1];
  if (mvnSeq.length === 0 || !last || last.exitCode !== 0) {
    const why = mvnSeq.length === 0 ? '无 mvn test（非 test-compile）记录' : '最后一条 mvn test exitCode=' + last.exitCode;
    problems.push(t.id + '（' + (t.subject||'').slice(0,40) + '）改动 ' + javaPaths.length + ' 个 Java 文件：' + why);
    continue;
  }
  // PV-2 真实性锚：mvn exit0 声称之后必须存在不早于卡关闭的 surefire 批次（伪造记录过不了目录时间）
  if (typeof t.updatedAt === 'number' && RD_EXISTS) {
    const fresh = newestSurefireBatch();
    if (fresh < t.updatedAt - 2 * 60000) {
      problems.push(t.id + ' 声称 mvn exit0 但 surefire 最新批次(' + new Date(fresh).toISOString().slice(11,19) + ') 早于卡关闭(' + new Date(t.updatedAt).toISOString().slice(11,19) + ')>2min：证据与产物时间不符');
    }
  }
  // 时序门：卡关闭(updatedAt)后文件又被改动>1min = 改后未验证，证据过期 fail-closed。
  for (const p of javaPaths) {
    const fp = join(W, p);
    if (!existsSync(fp)) { problems.push(t.id + ' changedPath 不存在: ' + p); continue; }
    if (typeof t.updatedAt === 'number' && statSync(fp).mtimeMs > t.updatedAt + 60000) {
      problems.push(t.id + ' 卡关闭后 ' + Math.round((statSync(fp).mtimeMs - t.updatedAt)/60000) + ' 分钟仍改动 ' + p + '：改后无验证，mvn 证据已过期');
    }
  }
}

const exitCode = runGate({ name: 'pre-verify', varName: 'QUANNENG_ALLOW_PREVERIFY_GAP',
  kind: '验收前行为门（Java 变更必须真实 mvn 通过）', items: problems, W,
  report: { workspace: W, gate: 'pre-verify', checked: tasks.length, problems } });
// F2 诚实面：0 张 Java 卡=真空绿，提示不阻断（Java 卡落板后复跑）。
if (exitCode === 0 && scannedJavaCards === 0) console.error('[提示] pre-verify 本轮 0 张 completed Java 卡：绿=真空绿；Java 卡落板后须复跑交叉验收。');
failFast(exitCode);
