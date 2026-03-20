# 强化 Theme Studio 可视化入口与工作台引导

## 补丁内容

增强 Theme 配置器的可发现性与工作台感知。将 sample 顶部原本不明确的“设置”入口升级为明确的“主题工作台”入口，并补充固定浮动入口、当前主题态与关键色预览，避免用户不知道项目里已经存在可视化主题配置界面。同步增强 `/theme` 示例页与 `u-theme` 组件本体的引导信息，明确说明当前面板就是可视化配置工作台，支持实时注入、分组编辑、重置与导出。

## 影响范围

- 修改文件: `sample/App.vue`
- 修改文件: `sample/src/theme/index.vue`
- 修改文件: `ui/components/theme/theme.vue`
- 修改文件: `ui/components/theme/style.scss`
