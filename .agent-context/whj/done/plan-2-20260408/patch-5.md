# Tree / Forest / TreeNode 迁移至 @cat-kit/core

## 补丁内容

- 全量移除业务代码对 `cat-kit` 包入口的 `Tree`、`Forest`、`TreeNode` 依赖；统一从 `@cat-kit/core` 导入 `Forest`、`TreeNode`、`dfs`、`bfs` 等 API。
- `Forest.create` / `.dft` / `.bft` / `.nodes` 等旧 API 分别迁移为 `new Forest({ data, childrenKey, createNode })`、`forest.dfs` / `forest.bfs`、`forest.roots`。
- 旧版 `Tree.dft` / `Tree.dftWithPath`（回调 `false` 仅剪枝子树）与 `@cat-kit/core` 的 `dfs`（回调 `true` 终止整段遍历）语义不同处：在 `packages/desktop/src/utils/tree-walk.ts` 提供 `treeDftPrune`、`forestRootsDftPrune`、`treeDftWithPath`；批量编辑中原 `Forest.visit` 改为 `visitDataTreeByPath`。
- 表格/树/级联等处的节点类改为继承 `@cat-kit/core` 的 `TreeNode` 并传入 `(data, index, depth, parent)`；去除虚拟根后行索引 `indexes`、可见行展平、`depth` 判断等已对齐新深度（根为 0）。
- `packages/desktop` 与 `apps/sample` 的 `package.json` 移除 `cat-kit` 依赖；`AGENTS.md` 更新核心依赖说明。

## 影响范围

- 新增文件: `packages/desktop/src/utils/tree-walk.ts`
- 修改文件: `packages/desktop/src/components/tree/*`、`table/*`、`cascade/*`、`menu/menu.vue`、`batch-edit/use-edit.ts`、`multi-tree-select/multi-tree-select.vue`、`tree-select/tree-select.vue`、`types/tree.ts`、`types/table.ts`、`types/cascade.ts`、`packages/desktop/package.json`、`apps/sample/package.json`、`apps/sample/src/table/full.vue`、`AGENTS.md`
