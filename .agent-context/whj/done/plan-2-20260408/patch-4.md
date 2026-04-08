# 修复 v-ripple 导致点击后容器异常变宽

## 补丁内容

波纹实现会在容器上临时设置 `overflow: hidden` 以裁剪波纹。对计算样式为 `display: inline` 的节点，CSS 会将盒子按块级参与布局（blockification），表现为宽度被拉满父级；迁移后更多场景触发了该路径。

在需要施加 `overflow: hidden` 且计算 `display === 'inline'` 时，同时设置 `display: inline-block`，并在波纹结束、重置容器样式时按原先内联 `display` 备份恢复或移除内联 `display`。

## 影响范围

- 修改文件: `packages/directives/src/ripple/ripple.ts`
