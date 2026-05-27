import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    platform: 'node',
    fixedExtension: false,
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: { neverBundle: ['@veltra/desktop', 'unplugin-vue-components'] },
    dts: true
  }
})
