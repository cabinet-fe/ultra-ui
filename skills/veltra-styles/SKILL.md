---
name: veltra-styles
description: >
  @veltra/styles 共享样式与主题系统：Theme 类型、UITheme、loadTheme/setTheme、
  BEM SCSS（mixins）、CSS 变量函数、深色模式、SCSS pkg 导入、组件级 token。
  当编写组件样式、定制主题、切换深色模式、使用 fn.use-var / fn.component-var、
  或排查 CSS 变量注入与 html 文档尺寸 class 时使用。
  完整源码镜像见 generated/；实操步骤见 references/theming-guide.md。
---

# veltra-styles

## 生成物

| 文件 | 内容 |
|------|------|
| [generated/theme-tokens.md](generated/theme-tokens.md) | `Theme` 类型与 `light`/`dark` 预设 TS |
| [generated/scss-api.md](generated/scss-api.md) | `_mixins`、`_functions`、`_vars` 完整 SCSS |
| [generated/theme-ts-api.md](generated/theme-ts-api.md) | `UITheme`、`loadTheme`、`helper` 等 TS |
| [generated/manifest.json](generated/manifest.json) | 同步时间与输出文件列表 |
| [references/theming-guide.md](references/theming-guide.md) | 快速开始、暗色、自定义主题、组件 token |

运行 `bun run sync-veltra-styles` 重新生成 `generated/`。

## 主题数据流（概览）

1. **`Theme` 类型**（`theme/type.ts`）描述颜色、字号、边框等嵌套 token 树。
2. **`UITheme` 类**（`theme/ui-theme.ts`）持有 `theme` 对象，将其拍平为 `--u-*` CSS 变量并注入文档（内置主题走 `injectBuiltInThemes`，自定义走 `render()`）。
3. **`loadTheme()`**（`load-theme.ts`）在浏览器侧初始化：默认注册 light/dark、同步 `useConfig` 的文档尺寸 class；可选传入自定义 `UITheme`。
4. **SCSS 消费**：`fn.use-var(...)`、`fn.component-var(...)` 生成 `var(--u-...)`，与注入变量一一对应。

## BEM 速查（`@veltra/styles/mixins`）

在 `@use 'pkg:@veltra/styles/mixins' as m` 前提下：

| Mixin | 生成类名示例 | 典型用途 |
|-------|--------------|----------|
| `@include m.b(name)` | `.u-name` | 块根 |
| `@include m.e(el)` | `&__el`（位于块内） | 元素 |
| `@include m.m(mod)` | `&--mod` | 修饰符 |
| `@include m.is(state)` | `.is-state` | 状态 class |

`m.dark()` 等包装在 `generated/scss-api.md` 的 `_mixins.scss` 中可查全文。

## SCSS 导入三件套

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';
```

消费方构建需启用 Sass **`NodePackageImporter`**（本仓库 desktop / playground 已配置）。

## CSS 变量辅助（`functions`）

- `fn.use-var(text-color, main)` → `var(--u-text-color-main)`（参数为 token 路径片段）。
- `fn.component-var(button, height)` → 组件命名空间下的变量（具体命名见 `Theme` 中对应块）。

完整签名与边界情况以 `generated/scss-api.md` 为准。

## TypeScript 主题 API 速查

| API | 作用 |
|-----|------|
| `loadTheme(theme?)` | 注入主题；无参时使用内置 light + dark 预设 |
| `setTheme('light' \| 'dark' \| 'auto')` | 切换 `data-theme` 或跟随系统 |
| `UITheme.new(partialTheme)` / `lightTheme.new(...)` | 由预设派生自定义 `UITheme` |
| `currentTheme` | `ShallowRef<UITheme \| undefined>`，当前活动主题实例 |

## 与 `@veltra/compositions` 的交界

`loadTheme` 内部使用 **`useConfig`** 将全局文档尺寸 class 挂到 `document.documentElement`。因此 **`@veltra/styles/theme` 运行时依赖 `vue` 与 `@veltra/compositions`**；`compositions` 包不得再导出 `theme`，以免循环依赖（见根目录 `AGENTS.md` 包图）。

## 延伸阅读（旧版参考文档）

与 `generated/` 镜像互补：跨仓库定位 Sass、主题运行时与构建集成。

- [references/source-discovery.md](references/source-discovery.md)
- [references/scss-foundation.md](references/scss-foundation.md)
- [references/theme-runtime.md](references/theme-runtime.md)
- [references/integration.md](references/integration.md)

## 维护

- 权威源码：`packages/styles/src/`（SCSS partial 与 `theme/`、`load-theme.ts`）。
- 变更 token 或主题逻辑后运行 `bun run sync-veltra-styles`，并检查 desktop 组件 SCSS 中的变量名是否仍对齐。
