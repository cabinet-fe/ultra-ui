import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite-plus'

// file: 直连的 @infinite-table/* 引擎包 alias 到本仓源码真实路径：
// bun 隔离快照（node_modules/.bun）内不嵌套 @infinite-table/render（file:+workspace:*
// 翻译限制），快照内的 src 解析裸导入 '@infinite-table/render' 会失败；
// alias 到真实路径后，引擎内部依赖经 infinite-table 仓工作区 node_modules 正常解析。
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  dependencies?: Record<string, string>
}
const engineAlias = Object.fromEntries(
  Object.entries(pkg.dependencies ?? {})
    .filter(
      ([name, spec]) => name.startsWith('@infinite-table/') && String(spec).startsWith('file:')
    )
    .map(([name, spec]) => [name, `${String(spec).slice('file:'.length)}/src/index.ts`])
)

export default defineConfig({
  // 解析条件对齐仓库其它包（veltra-dev 直连 @veltra/* 源码；`dev` 兜底）
  resolve: {
    alias: engineAlias,
    conditions: ['veltra-dev', 'dev', 'module', 'import', 'browser', 'default']
  },

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
    deps: { neverBundle: ['hucre', '@cat-kit/core'] },
    dts: true
  }
})
