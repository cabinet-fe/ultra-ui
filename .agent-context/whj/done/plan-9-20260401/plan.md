# 全局默认字体替换为系统字体栈

> 状态: 已执行

## 目标

移除自带的 Inter 字体文件，将全局 `font-family` 替换为业界流行的系统字体栈（system font stack），不引入任何额外字体文件，确保在 macOS / Windows / Linux / Android 上均能渲染出各平台最佳的原生无衬线字体。

## 内容

1. **更新 `ui/styles/theme/light.ts` 的 `font-family` 值**：替换为现代系统字体栈 `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`。
2. **移除 `ui/styles/normalize.scss` 中的 `@font-face` 声明**：删除第 8–11 行的 Inter 字体注册块。
3. **删除字体文件 `ui/styles/fonts/Inter.woff2`**：清除不再使用的 325KB 字体资源。

## 影响范围

- `ui/styles/theme/light.ts` — `font-family` 值替换为系统字体栈
- `ui/styles/normalize.scss` — 移除 `@font-face` Inter 字体声明
- `ui/styles/fonts/Inter.woff2` — 已删除（325KB）

## 历史补丁
