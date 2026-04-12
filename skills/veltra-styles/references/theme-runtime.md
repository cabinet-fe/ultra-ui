# Theme Runtime

## public API

源码入口：`packages/styles/src/theme/index.ts`

当前导出：

- `UITheme`
- `lightTheme`
- `darkTheme`
- `currentTheme`
- `loadTheme`
- `setTheme`
- `cssVar`
- `defineBySize`
- `HEXToRGB`
- `mixColor`
- `Theme` 相关类型

## `loadTheme()` 的真实语义

源码：`packages/styles/src/load-theme.ts`

行为摘要：

- 不传参时：
  注入内建 `lightTheme` 与 `darkTheme`
- 传自定义 `UITheme` 时：
  只渲染一次 `html { ... }`
- 在浏览器环境中：
  会把 `useConfig().config.size` 同步为 `document.documentElement` 的 class
- 在 SSR 环境中：
  需要延后到 `onMounted` 调用

## `UITheme` 的关键实现

源码：`packages/styles/src/theme/ui-theme.ts`

要点：

- theme 数据默认是 reactive 的，变更后自动 `render()`
- 变量名统一使用 `--u-*`
- 当前仍会生成不带 `u-` 的 legacy duplicate，用于兼容旧变量名
- `setTheme('auto')` 会移除 `html[data-theme]`
- 支持 `adoptedStyleSheets` 时优先走 `CSSStyleSheet`
- 否则回退到 `<style id="ultra-ui-theme">`

## 内建 light/dark 的选择器策略

由 `injectBuiltInThemes()` 产出：

- `html { light declarations }`
- `@media (prefers-color-scheme: dark) { html:not([data-theme="light"]) { dark declarations } }`
- `html[data-theme="light"]`
- `html[data-theme="dark"]`

因此 Sass 里的 `m.dark` 必须和这套选择器保持一致。

## playground 中的实际用法

`playgrounds/desktop/App.vue` 展示了最接近真实消费方的写法：

- 启动时先 `loadTheme()`
- 再用 `UITheme.setTheme(mode)` 切 light/dark/auto
- 通过 `u-theme` 组件直接编辑运行时 theme
