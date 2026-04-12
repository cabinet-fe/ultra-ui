# utils 工具迁移至 @cat-kit/core（主题 / omit / pick / 断点比较）

## 补丁内容

- **`packages/compositions/src/theme/ui-theme.ts`**：`isObj`、`kebabCase`、`mergeDeep` 改为 `@cat-kit/core` 的 `isObj`、`str().kebabCase()`、`o().deepExtend()`；`withUnit` 仍来自 `@veltra/utils`（core 无等价 API）。
- **`packages/desktop`**：`omit` / `pick` 改为 `o().omit` / `o().pick`；`context-menu` 去掉对未在 utils 源码中落地的 `objMap` 依赖，改为 `Object.entries` + `withUnit`；`use-responsive` 去掉对 `equal` 的依赖，改为按 `Breakpoint.name` / `level` 比较。
- 涉及文件：`context-menu.vue`、`grid/use-responsive.ts`、`form-item/helper.ts`、`form/use-node-interceptor.ts`、`batch-edit-list.vue`、`batch-edit-new.vue`、`action.vue`、`tree-select.vue`、`multi-tree-select.vue`。

## 影响范围

- 修改文件: `packages/compositions/src/theme/ui-theme.ts`
- 修改文件: `packages/desktop/src/components/context-menu/context-menu.vue`
- 修改文件: `packages/desktop/src/components/grid/use-responsive.ts`
- 修改文件: `packages/desktop/src/components/form-item/helper.ts`
- 修改文件: `packages/desktop/src/components/form/use-node-interceptor.ts`
- 修改文件: `packages/desktop/src/components/batch-edit/batch-edit-list.vue`
- 修改文件: `packages/desktop/src/components/batch-edit/batch-edit-new.vue`
- 修改文件: `packages/desktop/src/components/action/action.vue`
- 修改文件: `packages/desktop/src/components/tree-select/tree-select.vue`
- 修改文件: `packages/desktop/src/components/multi-tree-select/multi-tree-select.vue`
