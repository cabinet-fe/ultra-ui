# @veltra/styles

共享 SCSS 基础设施 + TypeScript 主题运行时。

## 子路径

| 子路径                     | 类型 | 内容                                                                               |
| -------------------------- | ---- | ---------------------------------------------------------------------------------- |
| `@veltra/styles`           | SCSS | normalize + 动画（副作用入口）                                                     |
| `@veltra/styles/mixins`    | SCSS | BEM mixins（`b()`, `e()`, `m()`, `is()`, `is-not()`, `size`, `dark`, 断点 mixins） |
| `@veltra/styles/vars`      | SCSS | SCSS 变量（`$color-types` 等）                                                     |
| `@veltra/styles/functions` | SCSS | CSS 变量引用函数（`use-var()`, `component-var()`）                                 |
| `@veltra/styles/normalize` | SCSS | 全局 normalize                                                                     |
| `@veltra/styles/anime/*`   | SCSS | 过渡动画（fade, slide, spring, zoom-in）                                           |
| `@veltra/styles/theme`     | TS   | 主题运行时（`UITheme`, `loadTheme`, `setTheme`, 预设主题）                         |

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

命名空间：`$namespace: 'u'`，分隔符：`__`（元素）、`--`（修饰符）。

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
fn.use-var(border-muted)           // var(--u-border-muted)
fn.use-var(radius, default)        // var(--u-radius-default)
fn.use-var(gap, small)             // var(--u-gap-small)

// component-var(component, token, fallback?) → var(--u-{component}-{token}[, fallback])
fn.component-var(button, bg)       // var(--u-button-bg)
fn.component-var(table, border)    // var(--u-table-border)
fn.component-var(button, height, $default) // var(--u-button-height, $default)
```

**命名空间区分：**

| 函数                    | 用途                              | 示例 CSS 变量                                                    |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `fn.use-var(...)`       | 全局主题 token（多级层级路径）    | `--u-text-color-main`、`--u-color-primary`、`--u-radius-default` |
| `fn.component-var(...)` | 组件命名空间变量（`组件名-属性`） | `--u-button-bg`、`--u-table-border`                              |

**CSS 变量完整命名规范：**

| 类别       | 变量模式                                                                             | 示例                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 颜色       | `--u-color-{type}`                                                                   | `--u-color-primary`、`--u-color-success`                                                                            |
| 颜色阶     | `--u-color-{type}-{light\|dark}-{1,3,5,7,9}`                                         | `--u-color-primary-light-3`（自动派生 10 阶）                                                                       |
| 背景       | `--u-bg-color-{layer}`                                                               | `--u-bg-color-bottom`、`--u-bg-color-hover`                                                                         |
| 背景透明度 | `--u-bg-color-{layer}-alpha`                                                         | `--u-bg-color-bottom-alpha`（自动叠加 `aa`）                                                                        |
| 背景滤镜   | `--u-bg-filter`                                                                      | `--u-bg-filter: blur(24px) saturate(180%)`（玻璃主题）                                                              |
| 文字色     | `--u-text-color-{role}`                                                              | `--u-text-color-main`、`--u-text-color-placeholder`                                                                 |
| 圆角       | `--u-radius-{size}`                                                                  | `--u-radius-small`、`--u-radius-default`                                                                            |
| 高度       | `--u-form-component-height-{size}`                                                   | `--u-form-component-height-default`                                                                                 |
| 字号       | `--u-font-size-{role}-{size}`                                                        | `--u-font-size-title-default`                                                                                       |
| 间距       | `--u-gap-{size}`                                                                     | `--u-gap-small`、`--u-gap-default`                                                                                  |
| 边框       | `--u-border-color`、`--u-border-muted-color`、`--u-border-width`、`--u-border-style` | 边框相关                                                                                                            |
| 边框简写   | `--u-border`、`--u-border-muted`                                                     | `--u-border-muted` 用于表单类组件的弱化边框                                                                         |
| 阴影       | `--u-shadow-color`、`--u-shadow-x`、`--u-shadow-blur`                                | 阴影相关                                                                                                            |
| 阴影简写   | `--u-shadow`                                                                         | `--u-shadow: var(--u-shadow-x) var(--u-shadow-y) var(--u-shadow-blur) var(--u-shadow-spread) var(--u-shadow-color)` |
| 浮雕阴影   | `--u-shadow-emboss`                                                                  | `--u-shadow-emboss: 0 2px 4px 0 #0000000a,0 1px 2px 0 #0000000f`（hero 主题）                                       |
| 断点       | `--u-breakpoint-{point}`                                                             | `--u-breakpoint-xs`（600）、`--u-breakpoint-lg`（1920）                                                             |
| 组件       | `--u-{component}-{property}`                                                         | `--u-button-bg`、`--u-input-border`                                                                                 |

### `m.size` 传参机制

`@include m.size using ($size)` 是 SCSS mixin 的 `@content` 传参语法。mixin 内部遍历 `small`/`default`/`large` 三种尺寸，并将当前尺寸名作为 `$size` 传入 `@content` 块：

```scss
// mixin 内部等价于：
@each $size in (small, default, large) {
  .u-component--size-#{$size} {
    @content ($size); // 将 $size 传入 @content 块
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

### 暗色模式与断点 Mixins

```scss
@use 'pkg:@veltra/styles/mixins' as m;

// 暗色模式下应用的样式（同时匹配 data-theme 与 prefers-color-scheme）
@include m.dark {
  background-color: fn.use-var(bg-color, bottom);
}

// 非状态选择器 — 等价于 :not(.is-disabled)
@include m.is-not(disabled) {
  &:hover { background-color: fn.use-var(bg-color, hover); }
}

// 断点值引用函数
@media screen and (max-width: m.breakpoint(sm)) { ... }

// 响应式断点 mixins（基于 CSS 变量 --u-breakpoint-{point}）
@include m.xs { ... }   // 0 ~ --u-breakpoint-xs
@include m.sm { ... }   // --u-breakpoint-xs ~ --u-breakpoint-sm
@include m.md { ... }   // --u-breakpoint-sm ~ --u-breakpoint-md
@include m.lg { ... }   // --u-breakpoint-md ~ --u-breakpoint-lg
@include m.xl { ... }   // >= --u-breakpoint-lg
```

### `css-var` Mixin

批量生成 CSS 变量：

```scss
@include m.css-var(
  height,
  (
    large: 40px,
    default: 32px,
    small: 24px
  )
);
// 生成：
// --u-height-large: 40px;
// --u-height-default: 32px;
// --u-height-small: 24px;
```

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
import '@veltra/directives/ripple/style' // 波纹样式
import '../icon/style' // 图标样式
import './style.scss' // 自身 SCSS
```

---

## Theme 系统

### 预设主题

`@veltra/styles/theme` 导出以下预设 `UITheme` 实例：

| 导出               | 说明                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `lightTheme`       | 默认亮色主题（`#1E88E5` 主色）                                                              |
| `darkTheme`        | 默认暗色主题（派生自 `lightTheme`）                                                         |
| `shadcnLightTheme` | shadcn/ui 风格亮色（zinc 色系，扁平阴影）                                                   |
| `shadcnDarkTheme`  | shadcn/ui 风格暗色                                                                          |
| `heroLightTheme`   | HeroUI 风格亮色（紫色 `#7828c8` 主色，2px 结构边框，表单弱化边框透明，大圆角，emboss 阴影） |
| `heroDarkTheme`    | HeroUI 风格暗色                                                                             |
| `glassLightTheme`  | 玻璃拟态亮色（半透明背景 + `blur(24px) saturate(180%)`）                                    |
| `glassDarkTheme`   | 玻璃拟态暗色（半透明深色背景 + `blur(20px) saturate(200%)`）                                |

所有派生主题通过 `lightTheme.new({...})` 链式创建：

```ts
import { lightTheme, glassLightTheme } from '@veltra/styles/theme'

// glassLightTheme 等价于：
const glass = lightTheme.new({
  color: { primary: '#3B82F6', ... },
  bg: {
    color: { bottom: 'rgba(255, 255, 255, 0.45)', ... },
    filter: { blur: 'blur(24px)', saturate: 'saturate(180%)' }
  },
  ...
})
```

### `loadTheme(theme?)`

在应用入口调用，注入主题 CSS 变量。

```ts
import { loadTheme } from '@veltra/styles/theme'
import { glassLightTheme } from '@veltra/styles/theme'

// 无参数：注入内置 light/dark 主题，自动响应 prefers-color-scheme，支持 setTheme() 切换
loadTheme()

// 传入预设主题（lightTheme / darkTheme / shadcnLightTheme / heroLightTheme / glassLightTheme 等）
// lightTheme / darkTheme → 仍注入双主题表，支持 setTheme() 切换
// 其他预设或自定义主题 → 单次 html {} 注入，不支持 setTheme()
loadTheme(glassLightTheme)
```

### `setTheme(mode)`

切换主题模式：

```ts
import { setTheme } from '@veltra/styles/theme'

setTheme('dark') // 强制暗色
setTheme('light') // 强制亮色
setTheme('auto') // 跟随系统
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
import { UITheme } from '@veltra/styles/theme'

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
    filter: { blur: 'none', saturate: 'none' }
  },
  border: {
    color: '#d9d9d9',
    mutedColor: '#d9d9d9', // 可选；缺省时回退到 color
    width: 1,
    style: 'solid'
  },
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
  shadow: { color: 'rgba(0,0,0,0.08)', x: 0, y: 2, blur: 8, spread: 0, emboss: 'none' },
  breakpoint: { xs: 600, sm: 960, md: 1280, lg: 1920 },
  button: { 'default-bg': 'var(--u-bg-color-top)' }
})

// 基于现有主题合并自定义
const custom = lightTheme.new({ color: { primary: '#ff6600' } })

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
import {
  cssVar,
  defineBySize,
  HEXToRGB,
  mixColor,
  themeTokenVar,
  componentCssVarsLight,
  componentCssVarsLightDecls,
  componentCssVarsDark,
  componentCssVarsDarkDecls
} from '@veltra/styles/theme'

// 快速创建 CSS 变量引用
cssVar('color-primary') // 'var(--u-color-primary)'

// themeTokenVar 与 SCSS fn.use-var 输出一致
themeTokenVar('text-color', 'main') // 'var(--u-text-color-main)'
themeTokenVar('color', 'primary', 'light', 9) // 'var(--u-color-primary-light-9)'

// 按尺寸定义值
defineBySize({ small: 20, default: 30, large: 40 })

// 颜色转换
HEXToRGB('#ff6600') // [255, 102, 0]
mixColor('#ff0000', '#0000ff', 0.5) // 混合色

// 组件级 CSS 变量声明（与内置主题一起注入 html）
componentCssVarsLight // Record<string, string> — 亮色及公共 token
componentCssVarsLightDecls // string[] — 展开为 '--u-xxx: val' 格式
componentCssVarsDark // Record<string, string> — 暗色 token
componentCssVarsDarkDecls // string[]
```

### 自定义 Theme 注入流程

```ts
import { UITheme } from '@veltra/styles/theme'
import { componentCssVarsLightDecls, componentCssVarsDarkDecls } from '@veltra/styles/theme'

// 注入双主题（支持 setTheme 切换）
UITheme.injectBuiltInThemes(myLightTheme, myDarkTheme)

// 单主题直接渲染（不需要暗色切换）
myTheme.render()
```

### 主题注入机制

1. **优选**：`CSSStyleSheet.adoptedStyleSheets` — 性能最佳，不产生 DOM 节点
2. **回退**：传统 `<style>` 标签注入到 `<head>`

`data-theme="light"` / `data-theme="dark"` 属性设置在 `document.documentElement` 上，配合 CSS 变量实现切换。

---

## 动画

预置 CSS 过渡动画，通过 `@veltra/styles` 副作用入口加载：

| 动画    | 用法     |
| ------- | -------- |
| fade    | 淡入淡出 |
| slide   | 滑入滑出 |
| spring  | 弹性动画 |
| zoom-in | 缩放入场 |

---

## 相关文档

- ../core-concepts.md — BEM 命名规范和主题系统概览
- utils.md — JS 端 BEM 类名工具
- ../quick-start.md — 主题快速上手
