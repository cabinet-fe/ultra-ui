# patch-1: 评审修复（Tree/Forest 与类型）

## 补丁内容

- 在 `@ultra-ui/core` 新增与旧 cat-kit/fe 对齐的 **`Forest.create` / `nodes` / `size` / `dft` / `bft`**（`dft` 回调返回 `false` 时剪枝子树），以及纯数据上的 **`Tree.dft` / `Tree.dftWithPath`**（`packages/core/src/utils/data-structure/`）。
- `packages/pc` 中业务代码改为从 `@ultra-ui/core` 引用 `Forest` / `Tree`；节点子树遍历改用 `@cat-kit/core` `TreeNode.dfs`（原 `dft`）。
- 修正误替换的 **`-ui/core` → `@ultra-ui/core`**；`types/index.ts` 从 `@ultra-ui/core` 再导出原 `helper` / `component-common` 类型；`button.ts` / `loading.ts` 同步修正相对路径导入。
- 调整 **CascadeNode / ColumnNode / TableRowNode / MenuNode / 树 TreeNode** 以适配新版 `TreeNode` 单参构造函数与 `parent` 类型；精简 `types` 中与基类冲突的 `parent`/`children` 重复声明。
- **multi-tree-select** 全选判断改为 `unref(treeRef.forest)?.size`；**message-confirm** 导出类型；**select/use-options** 标签过滤对 `getChainValue` 结果做 `String`；**table/use-rows** 的 `dft` 回调不再返回 `true`（避免 `boolean` 与 `void | false` 不兼容）；**use-menu-item** 移除未使用的 `shallowRef`。
- 对 **`Forest.create`** 补充显式泛型（`ColumnNode` / `TableRowNode` / `TreeNode`）以修复推断变宽问题。

## 影响范围

- 新增文件: `packages/core/src/utils/data-structure/legacy-forest.ts`、`packages/core/src/utils/data-structure/legacy-data-tree.ts`、`packages/core/src/utils/data-structure/index.ts`
- 修改文件: `packages/core/src/utils/index.ts` 及上述 `packages/pc` / `types` 相关文件
- 删除文件: 无

## 环境说明

当前沙箱内 **`bun install` 因证书失败**，未更新 `bun.lock`；请在可访问 registry 的环境执行 `bun install` 后运行 `bunx tsc -p packages/pc/tsconfig.json --noEmit` 与 `cd build && bun index.ts` 做最终验收。
