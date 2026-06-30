import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

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
