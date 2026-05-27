import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    platform: 'node',
    unbundle: true,
    sourcemap: true,
    clean: true,
    fixedExtension: false,
    treeshake: true,
    deps: { neverBundle: ['@veltra/desktop', 'unplugin-vue-components'] },
    dts: true
  }
})
