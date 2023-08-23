import { kebabCase, readDir } from 'cat-kit/be';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
let components = new Set();
readDir(resolve(__dirname, '../ui-packages/components'), {
    readType: 'dir'
}).then(dirs => {
    components = new Set(dirs.map(dir => dir.name));
});
export function UIResolver(componentName) {
    const kebName = kebabCase(componentName.slice(1));
    const kebNamePrefix = kebName.split('-')[0];
    if (componentName.startsWith('U')) {
        return {
            name: componentName,
            from: 'ultra-ui',
            sideEffects: `@ui/components/${components.has(kebNamePrefix) ? kebNamePrefix : kebName}/style`
        };
    }
}
