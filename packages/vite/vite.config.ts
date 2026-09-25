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
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
      neverBundle: ['@veltra/desktop', 'unplugin-vue-components']
    },
    dts: true
  }
})
