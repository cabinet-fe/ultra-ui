import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'happy-dom' },

  pack: {
    entry: ['src/index.ts', 'src/types/index.ts'],
    platform: 'browser',
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: { neverBundle: ['@cat-kit/core', 'vue'] },
    dts: true
  }
})
