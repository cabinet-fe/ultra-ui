# 移除 tree-walk，改用 @cat-kit/core

> 状态: 已执行

## 目标

删除 `packages/desktop/src/utils/tree-walk.ts`，树/表格展平改用 `Forest.flattenVisible` 等与 `@cat-kit/core` 一致的 API；菜单与批量编辑中无法由 `dfs(true)` 替代的少量遍历改为调用点内联实现，避免重复维护独立工具模块。

## 内容

1. `use-tree-nodes.ts`：`forestRootsDftPrune` 改为 `forest.value.flattenVisible(n => n.expanded)`，再 `.filter(n => n.visible)` 保持原语义。
2. `use-rows.ts`：`forestRootsDftPrune` 改为 `rowForest.value.flattenVisible(n => n.expanded)`（与「根行或父已展开」可见逻辑等价）。
3. `menu.vue`：移除对 `treeDftWithPath` 的依赖，在同文件内实现等价的深度优先 + 路径回调 + `false` 剪枝子树（匹配当前路径后不再深入该节点子级，但继续兄弟分支）。
4. `use-edit.ts`：内联原 `visitDataTreeByPath`（按 `indexPath` 在原始数据树中定位父节点），删除对 `tree-walk` 的 import。
5. 删除 `packages/desktop/src/utils/tree-walk.ts`，确认无其它引用后运行 `bun vitest`（或相关包测试）做回归。

## 影响范围

- `packages/desktop/src/utils/tree-walk.ts`（已删除）
- `packages/desktop/src/components/tree/use-tree-nodes.ts`
- `packages/desktop/src/components/table/use-rows.ts`
- `packages/desktop/src/components/menu/menu.vue`
- `packages/desktop/src/components/menu/walk-menu-path.ts`
- `packages/desktop/src/components/batch-edit/use-edit.ts`

## 历史补丁

- patch-1: 菜单路径遍历抽离
