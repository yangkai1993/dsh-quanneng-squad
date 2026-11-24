import { suggestAll, TIERS } from './lib/model-tiers.mjs';
const out = JSON.stringify(suggestAll(['御史大夫','测试经理']));
const bad = /gpt|claude|gemini|qwen|glm|deepseek|nemotron|qfmodel|flash/i;
process.exit(!bad.test(out) && TIERS.length === 4 ? 0 : 1);
