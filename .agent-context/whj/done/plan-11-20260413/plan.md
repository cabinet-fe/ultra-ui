# Select 下拉列表面板样式优化

> 状态: 已执行

## 目标

美化 `USelect` 下拉面板内选项列表与搜索区的视觉：与 Menu 等组件的设计语言对齐，改善间距、悬停/选中态与分隔区域观感。

## 内容

1. 调整 `ui/components/select/style.scss`：搜索区与列表区的背景与分隔线；选项列表使用 `flex` + `gap` 统一项间距（替代 `li` 的 `margin-top`）；选项增加过渡与与主题 `menu` 一致的悬停/选中背景与文字色；选中项增加左侧主色圆角指示条，字重改为 semibold 级别。
2. 调整 `ui/components/select/select.vue` 中 `useVirtual` 的 `gap` 与列表项视觉间距一致（与非虚拟列表的 `gap` 对齐）。

## 影响范围

- `ui/components/select/style.scss`
- `ui/components/select/select.vue`

## 历史补丁

- patch-1: Select 面板过滤输入去描边与交互底
