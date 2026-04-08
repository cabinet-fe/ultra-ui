# 修复表格多根列 Forest.bfs 导致表头 leafs 崩溃

## 补丁内容

`@cat-kit/core` 的 `Forest.bfs` 对每个根节点分别做 BFS。原先用回调里的 `node.depth` 拼表头行时，会在「上一棵树已遍历到较深深度」后，把下一棵树的根节点误放进新的「深度层」，该行内节点实为 `depth === 0` 的根，`parent` 未挂载，回溯 `parent.leafs` 时出现 `Cannot read properties of undefined (reading 'leafs')`。

改为从 `forest.roots` 一次性层序遍历生成表头分层，与多列表头布局一致；回溯时对 `parent` 做存在性判断，避免异常。

## 影响范围

- 修改文件: `packages/desktop/src/components/table/use-columns.ts`
