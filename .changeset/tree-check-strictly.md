---
'@veltra/desktop': patch
---

- 树（Tree）：`checkStrictly` 此前只挡了父节点联动，取消勾选仍会级联清掉整棵子树。现在严格模式勾选父节点仍级联选中子节点，但取消勾选只作用于自身（子节点保持勾选）
- 树（Tree）：严格模式下不再维护 `childrenCheckCount`，父节点不再因「有子节点被选中」显示半选态
- 树（Tree）：按住 ctrl 点击勾选/取消勾选只切换该节点，不再向上冒泡连带切换祖先
- 树（Tree）：`checkAll` 收敛进 `useCheck`，单次 `forest.dfs` 遍历并跳过 disabled 节点，合并为一次 `update:checked` 事件（原实现逐个根节点 `toggleCheck`，会重复触发事件与扁平化）
- 多选树选择器（MultiTreeSelect）：透传 `check-strictly` / `check-on-click-node`，并补充交互测试
