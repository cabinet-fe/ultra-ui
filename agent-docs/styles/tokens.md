---
title: "@veltra/styles Design Tokens 设计令牌与 CSS 变量系统"
description: "组件库全量 CSS 变量指南：详解 loadTheme 注入的 --u-* 设计令牌命名规范、主色系、背景色、文字颜色层级、阴影、圆角、alpha 透明度色阶与侧边栏专用 --u-nav-* 变量引用规范"
keywords: ["@veltra/styles Design Tokens 设计令牌与 CSS 变量系统", "@veltra/styles", "tokens"]
aliases: ["tokens", "@veltra/styles Design Tokens 设计令牌与 CSS 变量系统"]
---
token 由 `loadTheme`（内部 `UITheme.render()`）写到 `html`。切换预设或派生主题时，颜色、圆角、字号、阴影、动效会一起变。业务样式引用 token，不要硬编码色值或阴影。

## 怎么引用

SCSS（组件、指令样式优先这条路）：

```scss
@use 'pkg:@veltra/styles/functions' as fn;

.panel {
  color: fn.use-var(text-color, main);
  background: fn.use-var(bg-color, top);
  border: fn.use-var(border);
  border-radius: fn.use-var(radius, default);
  box-shadow: fn.use-var(shadow, sm);
}

.panel__action {
  height: fn.component-var(button, height, 32px);
}
```

普通 CSS 用 `var(--u-*)`。TS / 内联样式用 `cssVar('text-color-title')`（来自 `@veltra/styles/theme`）。

透明度不要自己 `color-mix`，用已注入的 alpha token：

```scss
background: fn.color-a(color, 8, primary); // var(--u-color-primary-a-8)
```

`color-a` 的不透明度档位须落在：`4 5 8 10 11 16 22 28 35 40 50 52 60 70 86`。

## 命名

`Theme` 对象路径转 kebab-case，前缀 `--u-`。`fn.use-var` 的参数与路径节点对应：

```scss
fn.use-var(color, primary) // --u-color-primary
fn.use-var(text-color, main) // --u-text-color-main
fn.use-var(bg-color, top) // --u-bg-color-top
fn.use-var(radius, default) // --u-radius-default
fn.use-var(form-component-height, small) // --u-form-component-height-small
fn.use-var(font-size-main, default) // --u-font-size-main-default
fn.use-var(gap, large) // --u-gap-large
```

`loadTheme` 还会生成色阶、简写和部分组件级变量：

```scss
fn.use-var(color, primary, light, 9) // --u-color-primary-light-9
fn.use-var(color, primary, dark, 1) // --u-color-primary-dark-1
fn.use-var(border) // --u-border（color + width + style）
fn.use-var(border, muted) // --u-border-muted
fn.use-var(shadow) // --u-shadow
fn.use-var(shadow, sm) // 贴面（卡片）
fn.use-var(shadow, lg) // 浮层（弹窗、下拉）
fn.use-var(shadow, emboss) // 浮雕；非浮雕主题为 none
fn.use-var(bg-filter) // --u-bg-filter
fn.use-var(transition, fast) // 微交互时长
fn.use-var(transition, normal)
fn.use-var(transition, slow)
fn.use-var(transition, ease)
fn.use-var(transition, ease-out)
fn.use-var(focus-ring) // 键盘 :focus-visible 的 box-shadow
```

语义色 `light` / `dark` 色阶档位为 `1 3 5 7 9`。数字 token（圆角、字号、高度、间距、断点）写入时会补 `px`。

非 hex 的颜色（例如 `glassTheme` 的 `rgba()` 背景）不会生成对应 alpha / 混合派生 token，组件侧 `var()` fallback 接手。

## 语义对照

| 语义 | Theme 路径 / CSS 变量 |
| --- | --- |
| 品牌与状态色 | `color.primary` / `success` / `warning` / `danger` / `info` / `disabled` / `default` |
| 色阶 | `--u-color-primary-light-9`、`--u-color-primary-dark-1` |
| 背景层 | `bg.color.bottom` / `middle` / `top` / `hover` / `black` |
| 文字 | `text-color.title` / `main` / `placeholder` / `second` / `assist` / `disabled` / `white` |
| 边框 | `border.color`、`border.mutedColor`、`border.width`、`border.style`；简写 `--u-border`、`--u-border-muted` |
| 圆角 | `radius.small` / `default` / `large` |
| 表单高度 | `form-component-height.small` / `default` / `large` |
| 字体 | `--u-font-family`；`font-size-title.*` / `font-size-main.*` / `font-size-assist.*` |
| 阴影 | `--u-shadow`、`--u-shadow-sm`、`--u-shadow-lg`、`--u-shadow-emboss` |
| 动效 | `transition.fast` / `normal` / `slow` / `ease` / `easeOut` |
| 焦点 | `--u-focus-ring`（组件级，配 `:focus-visible`） |
| 间距 | `gap.small` / `default` / `large` |
| 断点 | `breakpoint.xs` / `sm` / `md` / `lg` |
| 组件级 | 如 `--u-button-default-bg`；主题里也可写 `button['default-bg']` 覆盖 |

常用变量名：

```txt
--u-color-primary
--u-bg-color-bottom
--u-bg-color-middle
--u-bg-color-top
--u-bg-color-hover
--u-text-color-title
--u-text-color-main
--u-border
--u-border-muted
--u-radius-default
--u-form-component-height-default
--u-font-size-main-default
--u-shadow
--u-shadow-sm
--u-shadow-lg
--u-transition-fast
--u-transition-ease
--u-focus-ring
--u-gap-default
--u-breakpoint-md
```

暗色完全靠换主题（`series: 'dark'`）切换这套变量。组件 SCSS 不要再写 `[data-theme]`。

## 侧栏 `--u-nav-*`

`nav` / `dual-nav` / `group-nav` 专用。外观组随 `nav.variant`（默认 `dark`）变化；尺寸类不随 variant 变。覆盖方式见 `styles/theme.md`。

外观：

| token | 语义 |
| --- | --- |
| `--u-nav-bg-color` | 侧栏底色 |
| `--u-nav-color` | 导航项文字 |
| `--u-nav-hover-bg` / `--u-nav-hover-color` | 悬停 |
| `--u-nav-active-bg` / `--u-nav-active-color` | 激活项 |
| `--u-nav-strong-color` | 强调文字 |
| `--u-nav-second-color` | 次级文字（分组标题等） |
| `--u-nav-sub-border-color` | 子级缩进参考线 |
| `--u-nav-rail-bg` | dual-nav 轨道底色 |

尺寸与资源：

| token | 默认 |
| --- | --- |
| `--u-nav-height-small` / `--u-nav-height-default` / `--u-nav-height-large` | 32 / 36 / 40px |
| `--u-nav-rail-width` / `--u-nav-rail-labeled-width` | 56 / 72px |
| `--u-nav-bg-image` | `none` |
