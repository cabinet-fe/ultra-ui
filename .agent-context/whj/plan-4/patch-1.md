# 迁移 @ultra/icon → @ultra-ui/icons

## 补丁内容

将 `packages/desktop`、`apps/sample` 中所有 `@ultra/icon` 的命名导入改为 `@ultra-ui/icons` 的按需默认导入（`vue/normal/<kebab>`，彩色图标用 `vue/colorful/<kebab>`）。从 `packages/desktop` 与 `apps/sample` 的 `package.json` 移除 `@ultra/icon` 依赖/peer；`bun.lock` 随 `bun install` 更新。

`apps/sample` 的 Vite 增加 `@ultra-ui/icons/vue/*` → `packages/icons/src/vue/*.vue` 的 resolve alias，便于在未预构建 icons `dist` 时本地开发仍可解析。

`AGENTS.md` 核心依赖表改为 `@ultra-ui/icons`；`migrate.md` 中图标说明与现状对齐。

## 影响范围

- 修改文件: `packages/desktop/package.json`、`packages/desktop/src/components/**/*.vue`、`packages/desktop/src/components/**/*.tsx`、`packages/desktop/src/components/**/*.ts`、`apps/sample/package.json`、`apps/sample/vite.config.ts`、`apps/sample/**/*.vue`、`AGENTS.md`、`migrate.md`、`bun.lock`
