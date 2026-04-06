# patch-2: sample 预览可运行（导入修复）

## 补丁内容

- **`packages/pc`**：`code-editor.vue` 不再从仅 sample 可用的别名 `ultra-ui` 拉取 `UScroll` / 表单组合式 / `zIndex`，改为 `@ultra-ui/core` + 相对路径 `../scroll`，避免 Vite 解析失败。
- **`sample`**：将误替换的 `"-ui/pc"` 全部恢复为 `"@ultra-ui/pc"`（约 21 个示例页）。
- **`sample`**：`bem`、`setStyles` / `useTransition`、`useComponentProps` 等实际来自 core 的符号改为从 `@ultra-ui/core` 导入；`ButtonExposed`、`ButtonProps` 从 `@ultra-ui/pc/types` 导入。
- **`sample/package.json`**：增加与文档一致的 `dev` 脚本（`vite`），与原有 `play` 并存。

## 影响范围

- 修改文件: `packages/pc/src/components/code-editor/code-editor.vue`、`sample/package.json`、`sample/src/**/*.vue`（上述导入修正涉及的页面）
- 新增文件: 无
- 删除文件: 无
