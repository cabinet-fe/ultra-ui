import { defineConfig } from 'vite-plus'

// 根 vite.config.ts 仅承担 monorepo 级 Vite+ 配置：
// - test：Vitest 多包 projects 入口（`vp test`）
// - lint / fmt：Oxlint、Oxfmt（`vp lint`、`vp fmt`；类型检查由 lint.options.typeCheck 启用）
// - run：workspace 任务编排与缓存（`vp run`）
// - staged：pre-commit 检查（`vp staged`）
//
// 各 `@veltra/*` 库的 pack / 单包 test 配置位于包内 vite.config.ts。
export default defineConfig({
  test: { projects: ['packages/desktop', 'packages/styles', 'packages/utils'] },

  lint: {
    options: { typeAware: true, typeCheck: true },
    plugins: ['typescript', 'unicorn', 'oxc', 'vue'],
    categories: {
      correctness: 'error',
      suspicious: 'off',
      pedantic: 'off',
      perf: 'warn',
      style: 'off',
      restriction: 'off',
      nursery: 'off'
    },
    ignorePatterns: [
      '.agents/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/*.test.ts',
      '**/__test__/**'
    ],
    rules: {
      'no-unused-expressions': 'off',
      'no-floating-promises': 'off',
      'unbound-method': 'off'
    }
  },

  fmt: {
    ignorePatterns: ['**/dist/**', '**/CHANGELOG.md', '.changeset/**', '**/components.d.ts'],
    semi: false,
    singleQuote: true,
    bracketSpacing: true,
    bracketSameLine: false,
    trailingComma: 'none',
    jsxSingleQuote: true,
    objectWrap: 'collapse',
    experimentalSortPackageJson: true,
    experimentalSortImports: {}
  },

  run: { cache: { scripts: true, tasks: true } },

  staged: { '*.{ts,tsx,vue,js}': 'vp check --fix' }
})
