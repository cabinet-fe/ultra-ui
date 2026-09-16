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
      neverBundle: ['@visactor/vtable', '@visactor/vtable-editors', 'hucre', '@cat-kit/core']
    },
    dts: true
  }
})
