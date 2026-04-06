import { readDir } from '@cat-kit/be';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkbox } from '@inquirer/prompts';
import { UI_PATH } from '../shared';
const topEntries = await readDir(UI_PATH);
const topDirs = topEntries.filter(e => e.isDirectory && e.depth === 0 && e.name !== 'node_modules');
const packageNames = await checkbox({
    message: '导出哪些包?',
    choices: topDirs.map(p => ({
        name: p.name,
        value: p.name
    }))
});
function childFilter(entry) {
    if (entry.isFile) {
        return entry.name !== 'index.ts' && entry.name.endsWith('.ts');
    }
    if (entry.isDirectory) {
        return !/(__test__|node_modules)/.test(entry.name);
    }
    return false;
}
/**
 *
 * @param targetPackage 目标包名
 * @param prefix 导出前缀
 * @returns
 */
async function getContent(targetPackage, prefix) {
    const dirs = await readDir(targetPackage, {
        filter: childFilter
    });
    const contents = await Promise.all(dirs.map(async (entry) => {
        if (entry.isDirectory) {
            const existEntry = existsSync(join(entry.path, 'index.ts'));
            if (existEntry) {
                return `export * from '${prefix}${entry.name}'`;
            }
            const childFiles = await readDir(entry.path, {
                onlyFiles: true,
                filter: e => e.name.endsWith('.ts') && e.name !== 'index.ts'
            });
            return childFiles
                .map(filePath => {
                const base = filePath.split(/[/\\]/).pop();
                const stem = base.replace(/\.ts$/, '');
                return `export * from '${prefix}${entry.name}/${stem}'`;
            })
                .join('\n\n');
        }
        const stem = entry.name.replace(/\.ts$/, '');
        return `export * from '${prefix}${stem}'`;
    }));
    return contents.join('\n\n');
}
async function exportEntry() {
    await Promise.all(packageNames.map(async (pkg) => {
        const targetPackage = join(UI_PATH, pkg);
        await writeFile(join(targetPackage, 'index.ts'), await getContent(targetPackage, './'), 'utf-8');
    }));
}
exportEntry();
