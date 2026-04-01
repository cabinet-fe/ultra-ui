# 激活态左侧指示改为圆角短条

## 补丁内容

将激活态菜单项左侧由 `box-shadow` 满高实色条改为 `::before` 圆角胶囊短条：宽 `3px`、高度为行高的 `56%`（`min-height: 10px`）、垂直居中，颜色仍使用 `fn.use-var(color, primary)`，不改变现有 padding 与布局。

## 影响范围

- 修改文件: `ui/components/menu/style.scss`
