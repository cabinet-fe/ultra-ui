import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/grid/__test__/setup.ts'],
    globals: true,
    environment: 'happy-dom'
  },

  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  pack: {
    entry: ['src/index.ts'],
    platform: 'browser',
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: { neverBundle: ['@cat-kit/core', 'vue', '@visactor/vtable', '@visactor/vtable-editors'] },
    dts: true
  }
})
