import { defineConfig } from 'vite-plus'

export default defineConfig({
  // 解析条件对齐仓库其它包（veltra-dev 直连 @veltra/* 源码；`dev` 兜底）
  resolve: { conditions: ['veltra-dev', 'dev', 'module', 'import', 'browser', 'default'] },

  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/grid/__test__/setup.ts'],
    globals: true,
    environment: 'happy-dom',
    server: {
      deps: {
        // infinitable inline 进 vitest 模块图：其传递依赖 @cat-kit/core 经 vite
        // 容器按上方 resolve.conditions 解析到 dist。externalize 时由 worker
        // node 以 --conditions development 解析，会命中 @cat-kit/core 的
        // "development" → src/index.ts 导出条件，node_modules 下 TS 不可执行。
        inline: ['infinitable']
      }
    }
  },

  run: { tasks: { build: { command: 'vp pack', cache: { output: ['dist/**'] } } } },

  pack: {
    // core/io/import 与 core/events 是深导入通道（不在主入口白名单，见 AGENTS.md）：
    // 必须列为入口，否则 treeshake 会把主入口图不可达的导出摇掉（消费方打包
    // MISSING_EXPORT），且 dts 只随入口产出，深导入会解析不到类型
    entry: ['src/index.ts', 'src/grid/index.ts', 'src/core/io/import.ts', 'src/core/events.ts'],
    platform: 'browser',
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
      neverBundle: ['hucre', '@cat-kit/core']
    },
    dts: true
  }
})
