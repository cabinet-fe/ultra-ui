import { defineConfig } from 'vite-plus'

export default defineConfig({
  // 默认 node；需要 DOM 的测试文件在文件头加 // @vitest-environment happy-dom
  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'node', fsModuleCache: true },

  run: { tasks: { build: { command: 'vp pack', cache: { output: ['dist/**'] } } } },

  pack: {
    entry: ['src/index.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
      neverBundle: [
        '@veltra/utils',
        '@cat-kit/core',
        '@cat-kit/fe',
        'vue',
        '@floating-ui/dom',
        '@formkit/drag-and-drop'
      ]
    },
    dts: true
  }
})
