import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'happy-dom' },

  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true
    },
    entry: ['src/index.ts'],
    platform: 'browser',
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    dts: true
  }
})
