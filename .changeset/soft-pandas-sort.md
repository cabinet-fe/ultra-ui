---
'@veltra/compositions': patch
'@veltra/styles': patch
---

useDnD 易用性增强：排序/跨容器转移结果自动写回数据，无需手动 `onSort` splice。`values` 新增支持响应式数组（原地 splice 写回，非响应式纯数组由内部副本持有并同步原数组）、getter / 只读 computed；新增 `filter` 选项支持只对数据的可见子集排序并自动合并回原数组（未命中项保持相对顺序）；新增 `parent` 选项支持动态容器（元素出现/替换/移除时自动初始化/重建/销毁）；新增 `onReorder` 回调用于只读数据源写回。

新增 `ancientLightTheme` 古风主题 preset。
