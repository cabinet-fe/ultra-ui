---
name: veltra-styles
description: 面向 `@veltra/styles` 的共享 SCSS、BEM mixin/function、动画样式与主题运行时文档技能。用于配置 `pkg:@veltra/styles/...` Sass 引用、接入 `NodePackageImporter`、修改 `normalize`/`anime`、追踪 `@veltra/styles/theme` 的 `UITheme`/`loadTheme`/预设主题逻辑，或在其它项目中复用 Ultra UI 主题体系时使用。
---

# Veltra Styles

## 先确定你在处理哪一层

- 先读 [references/source-discovery.md](references/source-discovery.md)
  当 skill 被复制到其它项目，需要先定位 `@veltra/styles` 的源码、Sass 入口、安装产物或构建配置时
- 处理 Sass `@use 'pkg:@veltra/styles/...'`、BEM mixin、CSS 变量时，读取 [references/scss-foundation.md](references/scss-foundation.md)
- 处理 `UITheme`、`loadTheme()`、`lightTheme`/`darkTheme`、主题变量注入时，读取 [references/theme-runtime.md](references/theme-runtime.md)
- 处理 Vite/tsdown/Sass 配置、`NodePackageImporter`、副作用入口时，读取 [references/integration.md](references/integration.md)

## 抓住这几个关键边界

- `pkg:` 只属于 Sass，不属于 TypeScript import
- `@veltra/styles/theme` 运行时依赖 `@veltra/compositions/useConfig`，不要把 theme 反向导出回 `compositions`
- 组件级样式 token 放组件自己的 `style.scss`，共享基础设施才放进 `@veltra/styles`
- 内建 light/dark 主题由 `UITheme.injectBuiltInThemes()` 和 `html[data-theme]` / `prefers-color-scheme` 协同工作

## 快速源码锚点

- `packages/styles/src/_mixins.scss`
- `packages/styles/src/_functions.scss`
- `packages/styles/src/load-theme.ts`
- `packages/styles/src/theme/index.ts`
- `packages/styles/src/theme/ui-theme.ts`
