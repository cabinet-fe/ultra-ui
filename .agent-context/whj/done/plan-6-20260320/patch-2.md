# 增强 Theme 配置入口可发现性

## 补丁内容

为 `u-theme` 组件补充代码侧配置指引，在顶部明确展示 `loadTheme(lightTheme.new(...))` 的使用入口，并在每个变量编辑项旁边同时显示 Theme 对象路径与 CSS 变量名，解决用户只能看到 `--xxx` 但不知道代码里该在哪个字段设置的问题。同步更新 Theme 示例页，直接给出 `lightTheme.new({...})` 示例代码，降低主题变量配置的理解成本。

## 影响范围

- 修改文件: `ui/components/theme/theme.vue`
- 修改文件: `ui/components/theme/style.scss`
- 修改文件: `sample/src/theme/index.vue`
