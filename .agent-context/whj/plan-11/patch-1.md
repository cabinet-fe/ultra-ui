# Select 面板过滤输入去描边与交互底

## 补丁内容

下拉面板内 `filterable` 搜索框沿用 `UInput` 默认内阴影描边，与上方工具栏背景叠成「框套框」，观感突兀。在 `u-select__content-filter` 内对嵌套的 `u-input` 取消 `box-shadow`、默认透明底，悬停/聚焦时用主题 `bg-color` 的 hover / top 做轻微填充反馈，与列表区仍由底部分隔线区分。

## 影响范围

- 修改文件: `ui/components/select/style.scss`
