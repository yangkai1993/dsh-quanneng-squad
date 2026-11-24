// build-patch 薄壳（第1期重构）：真源生成逻辑在 lib/patch-sync.mjs，此处仅 CLI 入口。
import { syncPatchFile } from './lib/patch-sync.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { bytes, changed } = syncPatchFile(root);
console.log('generated cordis.patch.yml (' + bytes + ' bytes' + (changed ? '' : ', unchanged') + ') from canonical sources');
