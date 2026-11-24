import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const checks=[];const ck=(n,ok,x)=>checks.push({check:n,ok:!!ok,extra:String(x||'').slice(0,100)});
const PKGDIR=join(dirname(fileURLToPath(import.meta.url)),'..');
const LAB=join(PKGDIR,'..','..');  // 工作区真源（自包含，不依赖外部业务项目）
const NODE=process.env.QUANNENG_NODE||'node';
const run=env=>spawnSync(NODE,['scripts/env-guard.mjs'],{cwd:PKGDIR,encoding:'utf8',timeout:60000,env:{...process.env,...env}});
ck('无注入放行',run({}).status===0);
ck('真实根注入放行',run({QUANNENG_WORKSPACE:LAB}).status===0);
const fake=run({QUANNENG_WORKSPACE:'C:/tmp/fake-green'});
ck('伪工作区注入被拒（R-A1 修复）',fake.status===1,'exit='+fake.status);
const passed=checks.filter(c=>c.ok).length,failed=checks.length-passed;
console.log(JSON.stringify({fixture:'env-guard',checks,passed,failed,ok:failed===0},null,2));
if(failed)process.exit(1);
