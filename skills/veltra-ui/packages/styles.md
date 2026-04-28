# @veltra/styles

共享 SCSS 基础设施 + TypeScript 主题运行时。

## 子路径

| 子路径 | 类型 | 内容 |
|--------|------|------|
| `@veltra/styles` | SCSS | normalize + 动画（副作用入口） |
| `@veltra/styles/mixins` | SCSS | BEM mixins（`b()`, `e()`, `m()`, `is()`, `size`） |
| `@veltra/styles/vars` | SCSS | SCSS 变量（`$color-types` 等） |
| `@veltra/styles/functions` | SCSS | CSS 变量引用函数（`use-var()`, `component-var()`） |
| `@veltra/styles/normalize` | SCSS | 全局 normalize |
| `@veltra/styles/anime/*` | SCSS | 过渡动画（fade, slide, spring, zoom-in） |
| `@veltra/styles/theme` | TS | 主题运行时（`UITheme`, `loadTheme`, `setTheme` 等） |

---

## SCSS 基础设施

### 引用方式

使用 `pkg:` 协议引用（需要 `NodePackageImporter`）：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';
```

### BEM Mixins

命名空间：`$namespace: 'u-'`，分隔符：`__`（元素）、`--`（修饰符）。

```scss
@use 'pkg:@veltra/styles/mixins' as m;

// Block
@include m.b(button) {
  // → .u-button { ... }
}

// Element
@include m.e(icon) {
  // → .u-button__icon { ... }
}

// Modifier
@include m.m(color-primary) {
  // → .u-button--color-primary { ... }
}

// State
@include m.is(disabled) {
  // → .u-button.is-disabled { ... }
}

// 尺寸变体（遍历尺寸 map）
@include m.size using ($size) {
  // 在 .u-button--size-small、.u-button--size-default、.u-button--size-large 下生成
}
```

### 完整组件 SCSS 示例

```scss
@use 'sass:map';
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/vars';
@use 'pkg:@veltra/styles/functions' as fn;

$root-name: button;

@include m.b($root-name) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  border-radius: fn.use-var(radius, default);
  color: fn.use-var(text-color, main);
  background-color: fn.use-var(color, default);
  transition: all 0.2s ease;

  // 尺寸变体
  @include m.size using ($size) {
    height: fn.use-var(form-component-height, $size);
    padding: 0 fn.use-var(gap, $size);
  }

  // 颜色变体
  @each $type, $_ in vars.$color-types {
    @include m.m(color-#{$type}) {
      background-color: fn.use-var(color, $type);
      color: fn.use-var(text-color, white);

      &:hover {
        opacity: 0.85;
      }
    }
  }

  // 按钮形状
  @include m.is(circle) {
    border-radius: 50%;
    padding: 0;
  }

  @include m.is(text) {
    background-color: transparent;
    color: fn.use-var(color, primary);
  }

  @include m.is(disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @include m.is(loading) {
    cursor: wait;
  }

  // Element: 图标
  @include m.e(icon) {
    display: inline-flex;
    margin-right: fn.use-var(gap, small);
  }

  // Element: 文本
  @include m.e(text) {
    display: inline-flex;
  }
}
```

### CSS 变量引用函数

```scss
@use 'pkg:@veltra/styles/functions' as fn;

// use-var(token, sub?...) → var(--u-{token}-{sub})
fn.use-var(text-color, main)       // var(--u-text-color-main)
fn.use-var(color, primary)         // var(--u-color-primary)
fn.use-var(radius, default)        // var(--u-radius-default)
fn.use-var(gap, small)             // var(--u-gap-small)

// component-var(component, token, fallback?) → var(--u-{component}-{token}[, fallback])
fn.component-var(button, bg)       // var(--u-button-bg)
fn.component-var(table, border)    // var(--u-table-border)
fn.component-var(button, height, $default) // var(--u-button-height, $default)
```

**命名空间区分：**

| 函数 | 用途 | 示例 CSS 变量 |
|------|------|--------------|
| `fn.use-var(...)` | 全局主题 token（多级层级路径） | `--u-text-color-main`、`--u-color-primary`、`--u-radius-default` |
| `fn.component-var(...)` | 组件命名空间变量（`组件名-属性`） | `--u-button-bg`、`--u-table-border` |

**CSS 变量完整命名规范：**

| 类别 | 变量模式 | 示例 |
|------|---------|------|
| 颜色 | `--u-color-{type}` | `--u-color-primary`、`--u-color-success` |
| 背景 | `--u-bg-color-{layer}` | `--u-bg-color-bottom`、`--u-bg-color-hover` |
| 文字色 | `--u-text-color-{role}` | `--u-text-color-main`、`--u-text-color-placeholder` |
| 圆角 | `--u-radius-{size}` | `--u-radius-small`、`--u-radius-default` |
| 高度 | `--u-form-component-height-{size}` | `--u-form-component-height-default` |
| 字号 | `--u-font-size-{role}-{size}` | `--u-font-size-title-default` |
| 间距 | `--u-gap-{size}` | `--u-gap-small`、`--u-gap-default` |
| 边框 | `--u-border-color`、`--u-border-width`、`--u-border-style` | 边框相关 |
| 阴影 | `--u-shadow-color`、`--u-shadow-x`、`--u-shadow-blur` | 阴影相关 |
| 组件 | `--u-{component}-{property}` | `--u-button-bg`、`--u-input-border` |

### `m.size` 传参机制

`@include m.size using ($size)` 是 SCSS mixin 的 `@content` 传参语法。mixin 内部遍历 `small`/`default`/`large` 三种尺寸，并将当前尺寸名作为 `$size` 传入 `@content` 块：

```scss
// mixin 内部等价于：
@each $size in (small, default, large) {
  .u-component--size-#{$size} {
    @content($size);  // 将 $size 传入 @content 块
  }
}

// 使用时：
@include m.size using ($size) {
  height: fn.use-var(form-component-height, $size);
}
// 编译为：
// .u-component--size-small  { height: var(--u-form-component-height-small); }
// .u-component--size-default { height: var(--u-form-component-height-default); }
// .u-component--size-large  { height: var(--u-form-component-height-large); }
```

`$size` 变量只在 `using ($size)` 的 `@content` 块内可用。

### SCSS 变量

```scss
@use 'pkg:@veltra/styles/vars';

// 颜色类型列表
vars.$color-types  // ('primary': ..., 'info': ..., 'success': ..., 'warning': ..., 'danger': ...)
```

### 样式副作用入口

每个组件的 `style.ts` 声明样式依赖：

```ts
// button/style.ts
import '@veltra/directives/ripple/style'  // 波纹样式
import '../icon/style'                     // 图标样式
import './style.scss'                      // 自身 SCSS
```

---

## Theme 系统

### `loadTheme(theme?)`

在应用入口调用，注入主题 CSS 变量。

```ts
import { loadTheme } from '@veltra/styles/theme'

// 无参数：注入内置 light/dark 主题，自动响应 prefers-color-scheme
loadTheme()

// 传入自定义主题
import { lightTheme } from '@veltra/styles/theme'
const custom = lightTheme.new({
  color: { primary: '#ff6600' },
  radius: { default: 8 }
})
loadTheme(custom)
```

> **注意**：传入自定义主题后，走的是 `theme.render()` 单层注入逻辑，**不再支持 `setTheme()` 在 light/dark 间切换**。如需深色模式，需从 `darkTheme` 同样派生一份并自行管理切换。

### `setTheme(mode)`

切换主题模式：

```ts
import { setTheme } from '@veltra/styles/theme'

setTheme('dark')   // 强制暗色
setTheme('light')  // 强制亮色
setTheme('auto')   // 跟随系统
```

### `currentTheme`

当前主题实例的共享 ref：

```ts
import { currentTheme } from '@veltra/styles/theme'

console.log(currentTheme.value)
```

### `UITheme` 类

核心主题运行时类。

```ts
import { UITheme, lightTheme, darkTheme } from '@veltra/styles/theme'

// 内置预设
lightTheme   // UITheme 实例 — 亮色主题
darkTheme    // UITheme 实例 — 暗色主题

// 创建自定义主题
const myTheme = new UITheme({
  color: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#1677ff',
    disabled: '#d9d9d9',
    default: '#ffffff'
  },
  bg: {
    color: {
      bottom: '#f5f5f5',
      middle: '#ffffff',
      top: '#ffffff',
      hover: '#fafafa',
      black: '#000000'
    },
    filter: { blur: 0, saturate: 1 }
  },
  border: { color: '#d9d9d9', width: 1, style: 'solid' },
  'text-color': {
    title: '#262626',
    main: '#434343',
    placeholder: '#bfbfbf',
    second: '#8c8c8c',
    assist: '#bfbfbf',
    disabled: '#d9d9d9',
    white: '#ffffff'
  },
  radius: { small: 4, default: 6, large: 8 },
  'form-component-height': { small: 28, default: 36, large: 44 },
  'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
  'font-size-title': { small: 14, default: 16, large: 18 },
  'font-size-main': { small: 12, default: 14, large: 16 },
  'font-size-assist': { small: 10, default: 12, large: 14 },
  shadow: { color: 'rgba(0,0,0,0.08)', x: 0, y: 2, blur: 8, spread: 0 },
  gap: { small: 8, default: 12, large: 16 }
})

// 基于现有主题合并自定义
const custom = lightTheme.new({
  color: { primary: '#ff6600' }
})

// 渲染当前主题
myTheme.render()
```

### `UITheme` 静态方法

```ts
// 设置全局主题模式
UITheme.setTheme('dark')

// 注入内置主题（light + dark 两张主题表）
UITheme.injectBuiltInThemes(lightTheme, darkTheme)
```

### `themeToDeclarationList(theme)`

将 Theme 对象展开为 CSS 变量列表：

```ts
import { themeToDeclarationList } from '@veltra/styles/theme'

const vars = themeToDeclarationList(myTheme)
// ['--u-color-primary: #1890ff;', '--u-color-success: #52c41a;', ...]
```

### Theme 工具函数

```ts
import { cssVar, defineBySize, HEXToRGB, mixColor } from '@veltra/styles/theme'

// 快速创建 CSS 变量引用
cssVar('color-primary')  // 'var(--u-color-primary)'

// 按尺寸定义值
defineBySize({ small: 20, default: 30, large: 40 })

// 颜色转换
HEXToRGB('#ff6600')  // [255, 102, 0]
mixColor('#ff0000', '#0000ff', 0.5)  // 混合色
```

### 主题注入机制

1. **优选**：`CSSStyleSheet.adoptedStyleSheets` — 性能最佳，不产生 DOM 节点
2. **回退**：传统 `<style>` 标签注入到 `<head>`

`data-theme="light"` / `data-theme="dark"` 属性设置在 `document.documentElement` 上，配合 CSS 变量实现切换。

---

## 动画

预置 CSS 过渡动画，通过 `@veltra/styles` 副作用入口加载：

| 动画 | 用法 |
|------|------|
| fade | 淡入淡出 |
| slide | 滑入滑出 |
| spring | 弹性动画 |
| zoom-in | 缩放入场 |

---

## 相关文档

- ../core-concepts.md — BEM 命名规范和主题系统概览
- utils.md — JS 端 BEM 类名工具
- ../quick-start.md — 主题快速上手
