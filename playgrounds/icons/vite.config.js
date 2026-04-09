import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsRoot = resolve(__dirname, '../../packages/icons/src');
const iconsVueRoot = resolve(iconsRoot, 'vue');
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            { find: /^@ultra-ui\/icons\/vue\/(.+)$/, replacement: `${iconsVueRoot}/$1.vue` },
            { find: /^@ultra-ui\/icons\/normal$/, replacement: resolve(iconsRoot, 'normal.ts') },
            { find: /^@ultra-ui\/icons\/colorful$/, replacement: resolve(iconsRoot, 'colorful.ts') },
            { find: /^@ultra-ui\/icons$/, replacement: resolve(iconsRoot, 'index.ts') }
        ]
    },
    server: { port: 7789, host: true }
});
