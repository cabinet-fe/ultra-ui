import { readDir } from '@cat-kit/be';
import { cp, rm } from 'fs/promises';
import { resolve } from 'path';
import { UI_PATH } from '../shared';
const typesDir = resolve(UI_PATH, 'types');
const dtsFiles = await readDir(typesDir, {
    recursive: true,
    onlyFiles: true,
    filter: e => e.name.endsWith('.d.ts')
});
for (const filePath of dtsFiles) {
    const targetFilePath = filePath.replace(/\.d\.ts$/, '.ts');
    await cp(filePath, targetFilePath, {
        force: true
    });
    await rm(filePath);
}
