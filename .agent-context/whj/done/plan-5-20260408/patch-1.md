# 验证闭环：Vitest TSX + Oxlint 配置

## 补丁内容

- **Vitest**：根目录增加 `@vitejs/plugin-vue-jsx`，在 `vitest.config.ts` 与 `@vitejs/plugin-vue` 一并启用，使 `packages/desktop` 下 `.tsx`（Vue JSX）在测试管线中可被正确转换；移除无效的 `esbuild.jsx`（Vite 8 下会被 oxc 忽略）。
- **Oxlint**：以仓库历史中的分类策略恢复 `.oxlintrc.json`（correctness/suspicious/perf 为 `warn`，其余关闭），启用 `vue` 插件，忽略 `.agents/**`；根 `package.json` 的 `lint` 脚本改为 `oxlint .`（默认读取 `.oxlintrc.json`），避免指向不存在的 `oxlint.json`。

## 影响范围

- 新增文件: `.oxlintrc.json`
- 修改文件: `package.json`、`bun.lock`、`vitest.config.ts`
