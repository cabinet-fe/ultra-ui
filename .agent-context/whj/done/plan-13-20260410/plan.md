# getChainValue / setChainValue → @cat-kit/core `o().get` / `o().set`

> 状态: 已执行

## 目标

将全仓对 `getChainValue`、`setChainValue`（自 `@ultra-ui/utils`）的引用，统一改为 `@cat-kit/core` 的 `o(obj).get(prop)`、`o(obj).set(prop, value)`，与 cat-kit 对象工具 API 对齐，去掉对已迁移/缺失 utils 链式读写函数的依赖。

## 内容

1. 在 `packages/desktop` 与 `playgrounds/desktop` 中 grep 所有 `getChainValue`、`setChainValue` 引用。
2. 对每个文件：从 `@cat-kit/core` 增加 `o` 导入（若已有 cat-kit 导入则合并为一行）；删除 utils 上对应命名导入。
3. 将 `getChainValue(x, k)` 替换为 `o(x).get(k)`，将 `setChainValue(x, k, v)` 替换为 `o(x).set(k, v)`；模板与脚本均按此替换，保证 `o` 在 `<script setup>` 中导入以便模板可用。
4. 若同一文件仅从 utils 导入链式函数且无其他 utils 符号，移除该 utils import 行。
5. 运行 `bun run lint` 与 `bun vitest` 确认通过。

## 影响范围

- `packages/desktop/src/components/batch-edit/use-edit.ts`
- `packages/desktop/src/components/cascade/cascade.vue`
- `packages/desktop/src/components/cascade/use-data-map.ts`
- `packages/desktop/src/components/form/dynamic-form-model.ts`
- `packages/desktop/src/components/form/form-model.ts`
- `packages/desktop/src/components/form/form.vue`
- `packages/desktop/src/components/multi-select/multi-select.vue`
- `packages/desktop/src/components/progress-nodes/progress-nodes.vue`
- `packages/desktop/src/components/select/select.vue`
- `packages/desktop/src/components/select/use-options.ts`
- `packages/desktop/src/components/steps/steps.vue`
- `packages/desktop/src/components/table/use-check.ts`
- `packages/desktop/src/components/table/use-rows.ts`
- `packages/desktop/src/components/table/use-table.ts`
- `packages/desktop/src/components/tree/tree-node.ts`
- `packages/desktop/src/components/tree/use-check.ts`
- `packages/desktop/src/components/tree-select/tree-select.vue`
- `playgrounds/desktop/src/expression-editor/index.vue`
- `packages/compositions/src/theme/ui-theme.ts`
- `packages/desktop/src/components/context-menu/context-menu.vue`
- `packages/desktop/src/components/grid/use-responsive.ts`
- `packages/desktop/src/components/form-item/helper.ts`
- `packages/desktop/src/components/form/use-node-interceptor.ts`
- `packages/desktop/src/components/batch-edit/batch-edit-list.vue`
- `packages/desktop/src/components/batch-edit/batch-edit-new.vue`
- `packages/desktop/src/components/action/action.vue`
- `packages/desktop/src/components/tree-select/tree-select.vue`
- `packages/desktop/src/components/multi-tree-select/multi-tree-select.vue`

## 历史补丁

- patch-1: utils 工具迁移至 @cat-kit/core（主题 / omit / pick / 断点比较）
