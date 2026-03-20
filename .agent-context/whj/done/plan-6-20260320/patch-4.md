# 简化配置UI与修复滚动失效

## 补丁内容

移除了占据大量空间的 `hero` 与复杂 `workspace` 配置头，改为相对清爽紧凑的 `header`，降低用户理解成本和多余装饰带来的操作难度。同时修正了组件根节点下因为写死的 `.u-theme__list` 高度以及弹性盒（flex）未正确缩放导致不同屏幕尺寸下的各种内容隐藏和滚动失效问题。

## 影响范围

- 修改文件: `ui/components/theme/theme.vue`
- 修改文件: `ui/components/theme/style.scss`
