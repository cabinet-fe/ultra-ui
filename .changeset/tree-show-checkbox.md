---
"@veltra/desktop": minor
---

新增 `UTree` / `UMultiTreeSelect` 的可选函数属性 `showCheckbox(item, node): boolean`，用于决定某个节点是否渲染复选框。签名与 `disabledNode` 一致，整棵树构建完成后调用，默认不传时每个节点都显示复选框。

- 返回 `false` 的节点不渲染 checkbox；展开图标、节点文本与点击展开保持原样，`checkOnClickNode` 对它不触发勾选。
- 该节点不作为勾选值：`checkNode`、向上冒泡、`checkAll` 与 `update:checked` 都跳过它，子节点全选时也不会把它写进 `checkedData`；后代各自判定，不受影响，仍可单独勾选并进入 `modelValue`。
- `UMultiTreeSelect` 头部「全选」的总数改为只统计复选框可见的节点（原用 `forest.size`，隐藏部分复选框后全选态会失真）；传入 `modelValue` 中隐藏复选框的节点不再回显为标签。
- 删除标签时按节点 value 而非列表下标移除，避免可见标签被 `visibilityLimit` 折叠后误删。
