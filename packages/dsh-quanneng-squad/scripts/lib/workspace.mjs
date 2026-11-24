import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// 工作区真源：本插件与小队完全自包含于 dsh-squad-lab，运转不依赖任何外部项目。
// 优先级：显式 QUANNENG_WORKSPACE（仅测试注入）> 本包推导的仓库根（SSOT）。
const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG_DIR = resolve(HERE, '..', '..');              // scripts/lib -> package 根（实测修正）
export const LAB_ROOT = resolve(PKG_DIR, '..', '..');          // package -> packages -> lab 根
export const DEFAULT_WORKSPACE = LAB_ROOT;
export function resolveWorkspace(explicit) {
  return explicit || process.env.QUANNENG_WORKSPACE || DEFAULT_WORKSPACE;
}

