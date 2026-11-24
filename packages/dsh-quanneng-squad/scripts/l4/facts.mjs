import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readExemptions } from '../lib/exemptions.mjs';
import { deriveState } from '../lib/round-events.mjs';

const NODE = process.execPath;
const sh = (f, a, cwd) => { try { const r = spawnSync(f, a, { cwd, encoding: 'utf8', timeout: 300000 }); return { status: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') }; } catch (e) { return { status: 1, out: String(e && e.message) }; } };
const read = p => existsSync(p) ? readFileSync(p, 'utf8') : '';

const CN = { 零:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9 };
function cn2num(s) {
  if (!s) return NaN;
  if (/^\d+$/.test(s)) return Number(s);
  if (s.includes('百')) return cn2num(s.split('百')[0]) * 100 + cn2num(s.split('百')[1]);
  if (s.includes('十')) return (s.startsWith('十') ? 1 : CN[s[0]] || 0) * 10 + (s.length > 2 ? CN[s[2]] || 0 : 0);
  return CN[s] !== undefined && s.length === 1 ? CN[s] : NaN;
}

export function collectFacts(W) {
  const PKGDIR = join(W, 'packages/dsh-quanneng-squad');
  const f = { checks: {} };

  // 1) 玩具夹具：真跑 toy-fixture.mjs
  const toy = sh(NODE, [join(PKGDIR, 'scripts/l4/toy-fixture.mjs')], PKGDIR);
  let toyJson = null; try { toyJson = JSON.parse(toy.out); } catch {}
  f.toyFixturePassed = toy.status === 0 && !!toyJson?.allPassed;
  f.checks.toyFixture = { exit: toy.status, checks: toyJson?.checks, passed: toyJson?.passed };

  // 2) S8 基线：L4-BASELINE.json 存在且 javaTests>0（javaTests 由 provider 从 surefire 实算）
  const basePath = join(W, 'docs/squad/pipeline/L4-BASELINE.json');
  let base = null; try { base = JSON.parse(read(basePath)); } catch {}
  const surefireDir = join(W, 'gateway-java/target/surefire-reports');
  const surefire = existsSync(surefireDir)
    ? readdirSync(surefireDir).filter(x => x.endsWith('.txt'))
        .reduce((n, x) => n + Number(((readFileSync(join(surefireDir, x), 'utf8').match(/Tests run: (\d+)/) || [])[1] || 0)), 0)
    : 0;
  f.baselineCaptured = !!base && Number(base.javaTests) > 0 && surefire > 0;
  f.checks.baseline = { hasBase: !!base, recordedJavaTests: base?.javaTests, surefireTests: surefire };
  // 迭代标识 = 真实项目轮次（STATE.md「第 N 轮」的最大值）：同一轮内重复运行只计一次绿，
  // 进入下一轮才算新的项目迭代 —— 日期粒度太粗（一天可跑多轮），轮次才是项目实践的真实节奏。
  // 轮次真源=不可变事件日志（CQRS 读模型），叙述文档 STATE.md 不再驱动迭代编号。
  // 修复：此前从 STATE 文本提取最大值，导致写「第七十一轮」叙述动作能制造新迭代、伪造 hard-green 门槛。
  try {
    const ds = deriveState(W);
    f.projectIteration = ds.round > 0 ? 'round-' + ds.round : 'unknown';
  } catch { f.projectIteration = 'unknown'; }

  // 3) canary 槽位与范围：VERSION.md 里 canary 必须真实包含本提案号
  const ver = read(join(W, 'squad-toolkit/VERSION.md'));
  f.canarySlotFor = id => new RegExp('^canary: .*\\b' + id + '\\b', 'm').test(ver);
  f.canaryScopeDeclared = /^canary_scope: (?!\(空\)|\s*$)\S/m.test(ver);
  f.canarySlotWritten = false; // 由 run 按提案逐一切置

  // 4) 项目当前是否全绿：五门 + result-verify + release 链（--dry-run 不改动）
  const gates = ['seat-utilization','audit-roster','reflow-check','stage-order','drift-check'];
  const gateResults = {};
  for (const g of gates) { const r = sh(NODE, [join(PKGDIR, 'scripts/' + g + '.mjs')], PKGDIR); gateResults[g] = r.status; }
  const rv = sh(NODE, [join(PKGDIR, 'scripts/result-verify.mjs')], PKGDIR);
  const tests = sh(NODE, [join(PKGDIR, 'scripts/run-tests.mjs')], PKGDIR);
  // A13：带活动豁免的 exit 0 只是 soft-green，不得给 L4 固化计绿。
  const activeExemptions = Object.keys(readExemptions(W) || {});
  // V-52-02：env 形式的豁免尝试也必须被监督看见（即便已被 exemptions.mjs 拒绝）。
  const ENV_EXEMPT_VARS = ['QUANNENG_ALLOW_IDLE','QUANNENG_ALLOW_DEAD_ROUTE','QUANNENG_ALLOW_REFLOW_GAP',
    'QUANNENG_ALLOW_ORDER_GAP','QUANNENG_ALLOW_SCOPE_OVERLAP','QUANNENG_ALLOW_RESULT_GAP',
    'QUANNENG_ALLOW_L4_GAP','QUANNENG_ALLOW_MEMORY_SLA','QUANNENG_ALLOW_DRIFT','QUANNENG_ALLOW_LEAD_SCOPE'];
  for (const k of ENV_EXEMPT_VARS) if (process.env[k] === '1' && !activeExemptions.includes(k)) activeExemptions.push('env:'+k);
  f.projectGreenNow = gates.every(g => gateResults[g] === 0) && rv.status === 0 && tests.status === 0;
  f.greenLevel = (f.projectGreenNow && activeExemptions.length === 0) ? 'hard-green'
    : f.projectGreenNow ? 'soft-green' : 'red';
  f.activeExemptions = activeExemptions;
  f.checks.projectGreen = { gateResults, resultVerify: rv.status, pluginTests: tests.status };

  // 5) 熔断记录由 run 传入
  f.noFuseInCanary = true;

  // 6) bodyWritten：grep 目标文档真实条款文本（不靠人声称）
  f.bodyWritten = (needle, files) => files.some(fp => read(join(W, fp)).includes(needle));
  return f;
}
