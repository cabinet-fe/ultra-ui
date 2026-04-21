# 新增 rounded 属性与优化 close 按钮显示逻辑

## 补丁内容

- 新增 `rounded` 配置项：给 `TabsProps`、`TabsHorizontalProps`、`TabsVerticalProps` 追加了 `rounded` 属性，并在组件侧面消费。
- 优化了 close 按钮出现逻辑：移除 `focus` 触发，统一调整为仅在 `hover`（鼠标悬浮）时生效，解决了因为获得了焦点导致鼠标移出后关闭按钮依旧可见所产生的迟滞感。
- 优化了垂直 tabs 样式：在垂直布局下，关闭按钮的展示不再改变容器大小（使用 opacity 结合 pointer-events 显示与隐藏），防止了容器由于宽度的增加造成整体粗暴增大。

## 影响范围

- 修改文件: `/packages/desktop/src/types/tabs.ts`
- 修改文件: `/packages/desktop/src/components/tabs/tabs.vue`
- 修改文件: `/packages/desktop/src/components/tabs/tabs-horizontal.vue`
- 修改文件: `/packages/desktop/src/components/tabs/tabs-vertical.vue`
- 修改文件: `/packages/desktop/src/components/tabs/style.scss`
