// 扫描 packages/pc/src/components/*/index.ts 的 as U* 导出，重写 component-install-registry.ts。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const componentsDir = resolve(repoRoot, 'packages/pc/src/components');
const outFile = resolve(repoRoot, 'packages/pc/src/component-install-registry.ts');
const names = new Set();
for (const ent of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!ent.isDirectory())
        continue;
    const indexPath = join(componentsDir, ent.name, 'index.ts');
    let text;
    try {
        text = readFileSync(indexPath, 'utf8');
    }
    catch {
        continue;
    }
    for (const m of text.matchAll(/as\s+(U[A-Za-z0-9]+)/g)) {
        names.add(m[1]);
    }
}
const sorted = [...names].sort();
if (sorted.length === 0) {
    console.error('gen-pc-install-registry: no U-prefixed exports found');
    process.exit(1);
}
const importLine = sorted.join(',\n  ');
const body = `import type { Component } from 'vue'
import {
  ${importLine},
} from './components'

/** 全量 PC 组件，供 install 显式注册（避免 import * as 命名空间导入）。 */
export const pcInstallComponents = {
${sorted.map(n => `  ${n},`).join('\n')}
} as Record<string, Component>
`;
writeFileSync(outFile, body);
console.log(`gen-pc-install-registry: wrote ${sorted.length} components -> ${outFile}`);
