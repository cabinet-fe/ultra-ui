# Tokens

token 基于 theme 运行时生成，并由 `loadTheme()` 注入到 `html`。下游项目优先使用 veltra-ui token，这样切换内置主题或预设主题时，颜色、圆角、字号、阴影会自动跟随变化。

## 推荐用法

优先写 SCSS，并通过 `fn.use-var()` / `fn.component-var()` 引用 token。

```scss
@use 'pkg:@veltra/styles/functions' as fn;

.panel {
  color: fn.use-var(text-color, main);
  background: fn.use-var(bg-color, top);
  border: fn.use-var(border);
  border-radius: fn.use-var(radius, default);
  box-shadow: fn.use-var(shadow);
}

.panel__action {
  height: fn.component-var(button, height, 32px);
}
```

普通 CSS 中可以直接用 `var(--u-*)`，但组件、指令样式优先使用 SCSS 函数。

## 命名规则

`Theme` 路径转 kebab-case，并加 `--u-` 前缀。

```scss
fn.use-var(color, primary) // --u-color-primary
fn.use-var(text-color, main) // --u-text-color-main
fn.use-var(bg-color, top) // --u-bg-color-top
fn.use-var(radius, default) // --u-radius-default
fn.use-var(form-component-height, small) // --u-form-component-height-small
fn.use-var(font-size-main, default) // --u-font-size-main-default
fn.use-var(gap, large) // --u-gap-large
```

派生与简写：

```scss
fn.use-var(color, primary, light, 9) // --u-color-primary-light-9
fn.use-var(color, primary, dark, 1) // --u-color-primary-dark-1
fn.use-var(border) // --u-border
fn.use-var(border, muted) // --u-border-muted
fn.use-var(shadow) // --u-shadow
fn.use-var(shadow, emboss) // --u-shadow-emboss
fn.use-var(bg-filter) // --u-bg-filter
```

## 常用路径

| 语义     | 路径                                                            |
| -------- | --------------------------------------------------------------- |
| 颜色     | `color.primary` / `color.success` / `color.default`             |
| 色阶     | `color.primary.light.9` / `color.primary.dark.1`                |
| 背景     | `bg.color.bottom` / `bg.color.middle` / `bg.color.top`          |
| 文字     | `text-color.title` / `text-color.main` / `text-color.assist`    |
| 边框     | `border.color` / `border.width` / `border.style`                |
| 圆角     | `radius.small` / `radius.default` / `radius.large`              |
| 表单高度 | `form-component-height.small/default/large`                     |
| 字号     | `font-size-title.*` / `font-size-main.*` / `font-size-assist.*` |
| 阴影     | `shadow` / `shadow.emboss`                                      |
| 间距     | `gap.small` / `gap.default` / `gap.large`                       |
| 断点     | `breakpoint.xs/sm/md/lg`                                        |
| 组件级   | `component.property`，例如 `button.default-bg`                  |

常用真实 token：

```txt
--u-color-primary
--u-color-success
--u-color-warning
--u-color-danger
--u-color-info
--u-color-disabled
--u-color-default
--u-color-primary-light-9
--u-color-primary-dark-1
--u-bg-color-bottom
--u-bg-color-middle
--u-bg-color-top
--u-bg-color-hover
--u-bg-color-black
--u-bg-color-top-alpha
--u-bg-filter
--u-text-color-title
--u-text-color-main
--u-text-color-placeholder
--u-text-color-second
--u-text-color-assist
--u-text-color-disabled
--u-text-color-white
--u-border
--u-border-muted
--u-border-color
--u-border-muted-color
--u-border-width
--u-border-style
--u-radius-small
--u-radius-default
--u-radius-large
--u-form-component-height-small
--u-form-component-height-default
--u-form-component-height-large
--u-font-family
--u-font-size-title-small
--u-font-size-title-default
--u-font-size-title-large
--u-font-size-main-small
--u-font-size-main-default
--u-font-size-main-large
--u-font-size-assist-small
--u-font-size-assist-default
--u-font-size-assist-large
--u-shadow
--u-shadow-emboss
--u-gap-small
--u-gap-default
--u-gap-large
--u-breakpoint-xs
--u-breakpoint-sm
--u-breakpoint-md
--u-breakpoint-lg
--u-button-default-bg
```
