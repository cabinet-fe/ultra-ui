# tsconfig 与类型对齐补丁

## 补丁内容

- 移除各包 `tsconfig` 中的 `strict: false`，不再使用总开关关闭严格模式。
- 继承 `tsconfig.web.json` / `tsconfig.vue.json` 的包去掉冗余的 `types: ["bun"]` 与重复的 `lib`（由预设提供或与 Vue 预设一致）；`tools/build` 去掉与 `tsconfig.bun.json` 重复的 `lib`。
- 在仍依赖历史宽松检查的包中，**仅**显式设置 `noImplicitAny: false` 与 `noUncheckedIndexedAccess: false`（不使用 `strict: false`），以便在 TS 6 + `@cat-kit/tsconfig` 下保持可编译；后续可逐步收紧并修源码。
- `packages/utils`：`ui-theme.ts` 用 `globalThis` 上的可选 `process` 形状判断环境，避免在 web 预设里为 `process` 引入 `types`。
- `packages/desktop`：将树/表相关 `parent` 从 `null` 对齐为 `@cat-kit/core` 的 `ITreeNode`（`parent?: Self`）；`TableRowNode` 改为 `extends TreeNode<Data, TableRowNode<Data>>`；列 `Forest` 使用 `Forest<TableColumn, any>` 以满足 `Node extends Obj` 约束。

## 影响范围

- 修改文件: `packages/utils/tsconfig.json`、`packages/compositions/tsconfig.json`、`packages/directives/tsconfig.json`、`packages/mobile/tsconfig.json`、`packages/desktop/tsconfig.json`、`packages/icons/tsconfig.json`、`packages/icons/tsconfig.icons-vue.json`、`tools/build/tsconfig.json`、`packages/utils/src/styles/theme/ui-theme.ts`、`packages/desktop/src/types/tree.ts`、`packages/desktop/src/types/cascade.ts`、`packages/desktop/src/types/table.ts`、`packages/desktop/src/components/table/node/col.ts`、`packages/desktop/src/components/table/node/row.ts`、`packages/desktop/src/components/table/use-columns.ts`、`packages/desktop/src/components/tree/tree-node.ts`、`packages/desktop/src/components/tree/use-tree-nodes.ts`
