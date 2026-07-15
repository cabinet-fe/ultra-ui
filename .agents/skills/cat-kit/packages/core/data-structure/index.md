# core — 树与森林

## 何时使用

树/森林遍历、查找、扁平化、可见节点与节点关系。

## 推荐公开 API

- `dfs`、`bfs`
- `TreeNode`、`TreeManager`、`ForestNode`、`Forest`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- 遍历回调 `(node, index, parent?)`；返回 `true` 停止当前直接遍历
- 无 `createNode` 时 `TreeManager` 管理原始节点，不注入元数据方法
- `Forest.dfs`/`bfs` 在一棵树上停止后仍继续后续根
- 可见扁平化始终含根，仅沿 `isExpanded(node)` 为真的节点下行

## 类型入口

[tree.d.ts](../../../generated/core/data-structure/tree.d.ts) · [forest.d.ts](../../../generated/core/data-structure/forest.d.ts)
