# 移除圆角配置并优化 DOM 结构

## 补丁内容

- 移除了 UTabs 的 `rounded` 属性配置，默认将 TabItem 与列表设置为胶囊状圆角。
- 设置标准大小的 horizontal tabs 高度为 32px，调整 `header-item` 的高度。
- 精简了组件内的 DOM 结构，去掉了 `ul` 和 `li` 嵌套，直接采用 `div` 包含 `button` 的扁平结构，对齐 shadcn。

## 影响范围

- 修改文件: `packages/desktop/src/types/tabs.ts`
- 修改文件: `packages/desktop/src/components/tabs/tabs.vue`
- 修改文件: `packages/desktop/src/components/tabs/tabs-horizontal.vue`
- 修改文件: `packages/desktop/src/components/tabs/tabs-vertical.vue`
- 修改文件: `packages/desktop/src/components/tabs/style.scss`
