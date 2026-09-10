---
title: "--u-* 设计令牌 CSS 变量参考"
description: '@veltra/styles 注入到 html 的全量 --u-* CSS 变量：语义色、色阶、alpha 透明度、背景分层、文字色、边框、阴影、圆角、字号、动效、断点，以及 table、button、tag、nav 等组件级 token 的分组清单与命名规则。'
aliases: [设计令牌, tokens, CSS 变量, css 变量, var(--u-, 主题变量, 样式变量]
keywords: [--u-color-primary, --u-nav-bg-color, --u-focus-ring, --u-border, --u-shadow, --u-text-color-title, --u-radius-default, use-var, color-a, component-var, cssVar, alpha, 色阶, 圆角, 阴影, 暗色模式, 侧栏导航, 主题定制, 自定义样式, 面板样式, 边框, 背景色, 文字色]
---

# --u-* 设计令牌 CSS 变量参考

`--u-*` 是 Ultra UI 全部组件消费的设计令牌：`loadTheme()`（来自 `@veltra/styles/theme`）把全局 token、与主题系列匹配的组件级 token、nav 侧栏外观一次性写到 `html`。不调用 `loadTheme` 时 `--u-*` 为空，组件没有颜色。本文按组列出这些变量；主题对象结构与加载 API 见 `styles/theme.md`。

## 快速上手

先在入口加载主题，再按场景用三种方式引用 token：

```ts
// src/main.ts —— 前置：不执行则所有 --u-* 变量为空
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

本文的 token 用于在已有组件内扩展样式或写自定义业务样式，禁止用来手搓已有组件的等价外观：白底 + 描边 + 圆角 + 内边距的页面区块、面板、统计卡片容器用 `@veltra/desktop` 的 `UCard`（`UCardHeader` / `UCardContent` / `UCardAction`），文本排版用 `UText`，加载遮罩用 `vLoading`。手拼这些样式会漏掉 `loadTheme()` 的深浅色跟随，并在各页面重复。

```scss
// 组件 / 指令样式优先用 SCSS 函数（见 guide/scss.md）
@use 'pkg:@veltra/styles/functions' as fn;

// 自定义业务区块的样式；底色 / 描边 / 圆角直接用组件 token 而非这里手拼
.brand-block {
  color: fn.use-var(text-color, title); // var(--u-text-color-title)
  background: fn.use-var(bg-color, top); // var(--u-bg-color-top)
  border-bottom: fn.use-var(border); // var(--u-border-color) var(--u-border-width) var(--u-border-style)
}
```

```scss
/* 普通 CSS 直接写 var() */
.overlay {
  box-shadow: var(--u-shadow-lg);
}
```

## API 签名

### 命名与生成规则

- `Theme` 对象路径转 kebab-case、加 `--u-` 前缀，即变量名：`'text-color'.title` → `--u-text-color-title`，`form-component-height.small` → `--u-form-component-height-small`。
- SCSS 函数参数与路径节点一一对应：`fn.use-var(color, primary, light, 9)` → `var(--u-color-primary-light-9)`；`fn.component-var(button, height, 32px)` → `var(--u-button-height, 32px)`；`fn.color-a(color, 8, primary)` → `var(--u-color-primary-a-8)`。
- 数字（含数字字符串）写入时自动补 `px`；其余字符串原样写入。值为 `''` / `null` / `undefined` 的字段不产出声明，`0` 保留。
- 色阶只生成 `light` / `dark` × `1 3 5 7 9`；alpha 只生成上表列出的档位，`color-a` / `-a-{n}` 传入其他数字会得到不存在的变量。
- 派生 token（色阶、alpha、`--u-border`、`--u-shadow`、`--u-bg-filter`、混合 token）由 `loadTheme` 自动计算，业务侧禁止手写这些值。
- 非 hex 颜色（`rgba()` 等）不生成 alpha / 混合派生 token；glassTheme 等靠主题扩展键显式声明补齐。

## 参数说明

以下组名即 `Theme` 配置组（`styles/theme.md` 有完整类型）；`{type}` 指语义色枚举，`{size}` 指 `small` / `default` / `large`。

### 语义色与派生色阶

| 变量 | 说明 |
| --- | --- |
| `--u-color-{type}` | 7 个语义色：`primary` `success` `warning` `danger` `info` `disabled` `default` |
| `--u-color-{type}-light-{n}` / `-dark-{n}` | 与白/黑混合的色阶，`n` 取 `1 3 5 7 9`；如 `--u-color-primary-light-9` |
| `--u-color-{type}-a-{n}` | 语义色 alpha 透明度，`n` 取 `4 5 8 10 11 16 22 28 35 40 50 52 60 70 86` |

同规则生成 `--u-text-color-{type}-a-{n}`、`--u-border-color-a-{n}`、`--u-shadow-color-a-{n}`。

### 背景组

| 变量 | 说明 |
| --- | --- |
| `--u-bg-color-bottom` / `-middle` / `-top` / `-hover` / `-black` | 五层背景：页底、卡面、浮面、悬停、纯黑 |
| `--u-bg-color-{type}-alpha` | 背景 hex 值叠 `aa` 透明度（固定档） |
| `--u-bg-color-{type}-a-70` | 背景 alpha token，仅 `70` 一档 |
| `--u-bg-filter` | `bg.filter.blur + ' ' + saturate` 合成；`blur` 为 `'none'` 时整体 `'none'` |

### 文字色组

`--u-text-color-title` / `-main` / `-placeholder` / `-second` / `-assist` / `-disabled` / `-white`，另配 `--u-text-color-{type}-a-{n}`（`n` 取 `4 5 8 10 11 16 22 28 35 40 50 52 60 70 86`）。

### 边框组

| 变量 | 说明 |
| --- | --- |
| `--u-border-color` / `--u-border-muted-color` | 结构性边框色 / 弱化边框色（表单控件描边） |
| `--u-border-width` / `--u-border-style` | 宽度（数字补 px）、样式 |
| `--u-border` | 简写：`var(--u-border-color) var(--u-border-width) var(--u-border-style)` |
| `--u-border-muted` | 简写：`var(--u-border-muted-color) var(--u-border-width) var(--u-border-style)` |

### 阴影组

| 变量 | 说明 |
| --- | --- |
| `--u-shadow-color` / `-x` / `-y` / `-blur` / `-spread` | 阴影五要素 |
| `--u-shadow` | 简写：五要素按序拼接 |
| `--u-shadow-sm` | 低层级阴影（卡片等贴面元素），完整 box-shadow |
| `--u-shadow-lg` | 高层级阴影（弹窗、下拉等浮层），完整 box-shadow |
| `--u-shadow-emboss` | 浮雕阴影；非浮雕主题为 `none` |

### 尺寸组（数字写入时补 px）

| 变量 | 默认（lightTheme） |
| --- | --- |
| `--u-radius-small` / `-default` / `-large` | 6 / 8 / 12px |
| `--u-form-component-height-small` / `-default` / `-large` | 24 / 32 / 40px |
| `--u-gap-small` / `-default` / `-large` | 6 / 8 / 12px |
| `--u-font-family` | system-ui 字体栈 |
| `--u-font-size-title-{size}` | 14 / 16 / 18px |
| `--u-font-size-main-{size}` | 12 / 14 / 16px |
| `--u-font-size-assist-{size}` | 12 / 12 / 14px |
| `--u-breakpoint-xs` / `-sm` / `-md` / `-lg` | 600 / 960 / 1280 / 1920px |

### 动效组

`--u-transition-fast` / `-normal` / `-slow` / `-ease` / `-ease-out`（默认 `0.15s` / `0.25s` / `0.35s` / 两条 cubic-bezier）。注意 `Theme.transition.easeOut` 写入后是 `-ease-out`（kebab-case）。

### 组件级 token（随主题系列注入）

来源 `theme/component-css-vars.ts`，分 light / dark 两套，`loadTheme` 按主题 `series` 选择注入。按组件分组（组内只列代表，其余同模式）：

| 组 | 变量模式 |
| --- | --- |
| 焦点 | `--u-focus-ring`（light：`0 0 0 3px var(--u-color-primary-a-28)`；dark：`a-35`） |
| table | `--u-table-border-color`、`--u-table-header-bg` / `-color`、`--u-table-stripe-bg` / `-color`、`--u-table-hover-bg` / `-color`、`--u-table-current-bg` / `-color`、`--u-table-checked-bg` / `-color` |
| button | `--u-button-default-bg` / `-border` / `-color` / `-hover-bg` / `-hover-border`；`--u-button-{type}-plain-bg` / `-plain-shadow`（`{type}`：primary success warning danger info） |
| tag | `--u-tag-primary-bg` / `-color` / `-border` × 5 语义色；尺寸 `--u-tag-small` / `-default` / `-large`（20 / 24 / 28px） |
| select | `--u-select-option-hover-bg` / `-hover-color` / `-selected-bg` / `-selected-color` |
| auto-complete | `--u-auto-complete-option-hover-bg` / `-hover-color` / `-selected-bg` / `-selected-color` |
| contextmenu | `--u-contextmenu-item-hover-bg` / `-hover-color`；`--u-contextmenu-item-height-small` / `-default` / `-large`（24 / 28 / 32px） |
| tree | `--u-tree-node-selected-bg` / `-selected-color` |
| cascade | `--u-cascade-node-active-bg` / `-active-color` |
| tabs | `--u-tabs-bar-bg`、`--u-tabs-active-bg`（dark 下 `bar-bg` 用 `bg-color-bottom`） |
| paginator | `--u-paginator-btn-hover-bg` / `-hover-color` / `-active-bg` / `-active-color` |
| expression-editor | `--u-expression-editor-chip-bg` / `-color` |
| file-picker | `--u-file-picker-hover-bg` |
| card | `--u-card-header-bg`、`--u-card-action-bg`、`--u-card-padding-small` / `-default` / `-large`（8 / 12 / 16px）、`--u-card-radius` |
| switch | `--u-switch-height-small` / `-default` / `-large`（18 / 20 / 24px） |
| breadcrumb | `--u-breadcrumb-small` / `-default` / `-large`（20 / 22 / 24px） |
| 混合 token | `--u-batch-edit-form-header-bg`、`--u-kbd-inset-shadow` / `-border-shadow` / `-drop-shadow`（依赖色非 hex 时跳过，组件侧 fallback 接管） |

### nav 组（nav / dual-nav / group-nav 专用）

分两类。尺寸与资源类固定值，不随 variant 变：

| 变量 | 默认 |
| --- | --- |
| `--u-nav-height-small` / `-default` / `-large` | 32 / 36 / 40px |
| `--u-nav-rail-width` / `--u-nav-rail-labeled-width` | 56 / 72px |
| `--u-nav-bg-image` | `none` |

外观类随「主题系列 × `nav.variant`」注入（`variant` 默认 `'dark'`），共 10 个：`--u-nav-bg-color`、`--u-nav-color`、`--u-nav-hover-bg`、`--u-nav-hover-color`、`--u-nav-active-bg`、`--u-nav-active-color`、`--u-nav-strong-color`、`--u-nav-second-color`、`--u-nav-sub-border-color`、`--u-nav-rail-bg`。主题 `nav` 的其余键写在同名列之后，覆盖内置值（`styles/theme.md`）。

## 典型示例

### 组件 SCSS 消费 token

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(pay-card) {
  background: fn.use-var(bg-color, top);
  border-radius: fn.use-var(radius, default);
  box-shadow: fn.use-var(shadow, sm);
  transition: background fn.use-var(transition, normal) fn.use-var(transition, ease);

  @include m.e(title) {
    color: fn.use-var(text-color, title);
  }

  @include m.is(active) {
    // 半透明主色必须用 alpha token，不要 color-mix
    background: fn.color-a(color, 8, primary);
  }
}
```

### CSS 与 TS 内联引用

```css
/* 业务全局样式直接写 var()，前置是入口已 loadTheme */
.status-bar {
  color: var(--u-text-color-second);
  border-top: var(--u-border);
}
```

```ts
// TS / 内联样式用 cssVar（来自 @veltra/styles/theme）
import { cssVar } from '@veltra/styles/theme'

el.style.setProperty('--progress-color', cssVar('color-primary')) // var(--u-color-primary)
```

### 应用层覆盖组件级 token

```ts
// 方式一：主题扩展键（随主题派生，推荐）
import { darkTheme, loadTheme } from '@veltra/styles/theme'

loadTheme(darkTheme.new({ nav: { 'bg-color': '#101418' } }))
// => --u-nav-bg-color: #101418，写在内置值之后，必生效
```

```css
/* 方式二：普通 CSS 在 loadTheme 之后加载的样式里覆盖（利用同 specificity 后者胜） */
:root {
  --u-card-radius: 16px;
}
```

## 注意事项

> [!WARNING]
> - 本库 token 前缀是 `--u-`，不是 Element Plus 的 `--el-`、Ant Design 的 `--ant-`；从其他组件库迁移时禁止直接套用其变量名。
> - 变量名按主题对象路径生成，**没有** `primary` / `secondary` / `border-radius` 这类后缀写法：文字色是 `--u-text-color-title` / `-main` / `-placeholder` / `-second` / `-assist` / `-disabled` / `-white`，圆角是 `--u-radius-small` / `-default` / `-large`。写 `var(--u-text-color-primary)`、`var(--u-text-color-secondary)`、`var(--u-border-radius)` 全部取不到值——无 fallback 时 `color` 退化为继承、`border-radius` 退化为 0（直角），且不随主题切换。
> - 页面区块、面板、统计卡片这类容器用 `@veltra/desktop` 的 `UCard`，不要用本页 token 手拼等价卡面；`UCard` 的边框、圆角、阴影已由 `--u-border-muted` / `--u-card-radius` / `--u-shadow-sm` 与 `--u-card-padding-*` 提供。
> - 不调用 `loadTheme` 时 `--u-*` 为空、组件无颜色；任何引用 token 的样式都以入口加载主题为前提。
> - 暗色不靠 `[data-theme]` 手写分支：换 `series: 'dark'` 的主题即可，组件 token 两套随系列自动切换。业务 SCSS 里 `[data-theme='dark']` 分支仅在 token 覆盖不了时使用（`@include m.dark`）。
> - `color-a` 与 `-a-{n}` 的档位固定为 `4 5 8 10 11 16 22 28 35 40 50 52 60 70 86`，`light-{n}` / `dark-{n}` 固定为 `1 3 5 7 9`；传其他数字引用不到变量。
> - 断点 token 是长度值（`px`），写入媒体查询时注意部分环境对 `var()` in `@media` 的支持；组件库自身的断点 mixin 直接使用该变量。
> - 组件级 token 的具体值随主题 `series` 与 preset 变化，本文只列默认（lightTheme / light 系列）；禁止在业务代码里硬编码 token 的当前值。
