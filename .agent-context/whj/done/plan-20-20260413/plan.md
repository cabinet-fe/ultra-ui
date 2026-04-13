# 统一 @veltra/utils 类型导入

> 状态: 已执行

## 目标

在移除 `@veltra/utils` 的 `./types` 包导出后，消除 `@veltra/desktop`（及同仓库内必要依赖）中仍指向 `@veltra/utils/types` 的导入，使类型仅从 `@veltra/utils` 主入口解析，并通过 `check-types` 验证。

## 内容

1. 从 `packages/utils/package.json` 的 `exports` 中移除 `./types` 子路径（若仍存在），保留根 `export * from './types'` 的主入口聚合。
2. 在 `packages/desktop` 内将 `@veltra/utils/types`、`@veltra/utils/types/helper`、`@veltra/utils/types/component-common` 等全部改为从 `@veltra/utils` 导入；同一文件内合并为单条 `import type`（在明显可合并时）。
3. 将仍使用 `@veltra/utils/types` 的 `packages/compositions`、`tools/cli/gen-component/render-file.ts` 改为 `@veltra/utils`，避免移除导出后其它包类型失败。
4. 在仓库根执行 `bun run check-types`（或针对相关包的 turbo 任务），修复直至通过。

## 影响范围

- `packages/utils/package.json`：移除 `exports["./types"]`。
- `packages/desktop/src/types/**`、`packages/desktop/src/components/form-item/helper.ts`、`packages/desktop/src/components/grid/use-responsive.ts`、`packages/desktop/src/components/table/table-foot.vue`：类型导入改为 `@veltra/utils`。
- `packages/compositions/src/use-config/index.ts`、`use-fallback-props/index.ts`、`use-form-component/index.ts`：同上。
- `tools/cli/gen-component/render-file.ts`：模板中的类型导入改为 `@veltra/utils`。
- `packages/icons/scripts/gen-vue-icons.ts`：图标 SFC 生成不再输出根 `svg` 的 `width`/`height`。
- `packages/icons/src/vue/normal/*.vue`、`packages/icons/src/vue/colorful/*.vue`：随 `icons:gen` 全量重生成。

## 历史补丁

- patch-1: 图标 Vue 生成移除根 svg 宽高
