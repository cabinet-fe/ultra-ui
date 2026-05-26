# @veltra/styles

共享 SCSS 基础设施 + TypeScript 主题运行时。SCSS 引用需 `NodePackageImporter`（`pkg:` 协议）。

---

## 快速上手

```ts
// main.ts
import '@veltra/styles/normalize'    // 全局 reset
import '@veltra/styles/transitions'  // Vue 过渡动画
import { loadTheme, setTheme } from '@veltra/styles/theme'

loadTheme()  // 注入内置 light+dark，自动跟随系统偏好
```

---

## Theme 系统

### 预设主题（从 `@veltra/styles/theme` 导入）

| 导出 | 风格 |
|------|------|
| `lightTheme` / `darkTheme` | 默认（`#1E88E5` 主色） |
| `shadcnLightTheme` / `shadcnDarkTheme` | shadcn/ui（zinc 色系） |
| `heroLightTheme` / `heroDarkTheme` | HeroUI（紫色，emboss 阴影） |
| `glassLightTheme` / `glassDarkTheme` | 玻璃拟态（半透明 + blur） |

### 加载与切换

```ts
import { loadTheme, setTheme, UITheme, lightTheme } from '@veltra/styles/theme'

// 无参数：内置双主题，支持 setTheme() 切换 + 系统偏好响应
loadTheme()

// 传入 lightTheme/darkTheme 同上
loadTheme(lightTheme)

// 其他预设或自定义 → 单主题注入，不支持 setTheme
loadTheme(glassLightTheme)

// 基于现有主题派生
loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))

// 运行时切换（仅双主题模式）
setTheme('dark')   // html[data-theme="dark"]
setTheme('auto')   // 移除 data-theme，跟随系统
```

### 从零创建主题

`new UITheme(theme)` 接收完整的 `Theme` 类型对象（所有字段必填），字段结构见 `theme/type.ts` 中的 `Theme` 类型定义。推荐基于现有预设派生而非从零构建。

---

## SCSS 体系

### 导入方式

```scss
@use 'pkg:@veltra/styles/mixins' as m;      // mixins（自动 @forward vars）
@use 'pkg:@veltra/styles/functions' as fn;  // functions（自动 @forward vars）
@use 'pkg:@veltra/styles/vars';             // 仅 vars
```

三个入口共享同一个 `$namespace`（默认 `'u'`），覆盖后 mixins 和 functions 生成的选择器/变量名同步变更：

```scss
@use 'pkg:@veltra/styles/mixins' as m with ($namespace: 'my-app');
// .my-app-button, var(--my-app-color-primary) ...
```

### Variables

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `$namespace` | `'u'` | BEM 前缀 + CSS 变量前缀 |
| `$sizes` | `(small, default, large)` | `m.size` 遍历列表 |
| `$color-types` | `(primary, success, warning, danger, info, disabled, default)` | 颜色语义枚举 |
| `$color-primary` | `var(--u-color-primary)` | 语义别名 |
| `$text-color-main` | `var(--u-text-color-main)` | 语义别名 |
| `$border-color` | `var(--u-border-color)` | 语义别名 |
| `$bg-color-top` | `var(--u-bg-color-top)` | 语义别名 |

### Mixins

```scss
// BEM 选择器
@include m.b(button) { }                // .u-button
@include m.e(icon) { }                  // &__icon（需嵌套在 b 内）
@include m.m(primary) { }              // &--primary
@include m.em(icon, left) { }           // &__icon--left
@include m.bem(button, icon, left) { }  // .u-button__icon--left

// 尺寸变体
@include m.size using ($size) {
  height: fn.use-var(form-component-height, $size);
}
// → .u-button--small { height: var(--u-form-component-height-small) } ...

// 状态
@include m.is(disabled) { }      // &.is-disabled
@include m.is-not(disabled) { }  // &:not(.is-disabled)

// 布局
@include m.flex($display, $justify, $align, $wrap);
@include m.ellipsis;

// CSS 变量批量生成
@include m.css-var(height, (large: 40px, default: 32px, small: 24px));

// 暗色模式（匹配 data-theme + prefers-color-scheme）
@include m.dark { background: fn.use-var(bg-color, bottom); }

// 响应式断点
@include m.xs { }  // 0 ~ breakpoint-xs
@include m.sm { }  // xs ~ sm
@include m.md { }  // sm ~ md
@include m.lg { }  // md ~ lg
@include m.xl { }  // >= lg
```

### Functions

**`fn.use-var($basename, $nodes...)`** — 最常用的函数，用于引用主题 CSS 变量。

参数直接对应 `Theme` 类型的嵌套路径：`$basename` 是第一层 key，`$nodes` 是后续层级的 key，用逗号分隔。生成规则：`var(--{$namespace}-{$basename}-{$node1}-{$node2}...)`。

```scss
// Theme.color.primary        → fn.use-var(color, primary)         → var(--u-color-primary)
// Theme.text-color.main      → fn.use-var(text-color, main)       → var(--u-text-color-main)
// Theme.bg.color.top         → fn.use-var(bg-color, top)          → var(--u-bg-color-top)
// Theme.radius.default       → fn.use-var(radius, default)        → var(--u-radius-default)
// Theme.form-component-height.small → fn.use-var(form-component-height, small)
// Theme.font-size-main.default      → fn.use-var(font-size-main, default)
// Theme.gap.large            → fn.use-var(gap, large)             → var(--u-gap-large)
// Theme.shadow（shorthand）   → fn.use-var(shadow)                 → var(--u-shadow)
// Theme.border（shorthand）   → fn.use-var(border)                 → var(--u-border)
// 派生色阶（自动生成）        → fn.use-var(color, primary-light-3) → var(--u-color-primary-light-3)
```

注意：`Theme.bg` 渲染时 `bg.color` 扁平为 `bg-color-*`，`bg.filter` 扁平为 `bg-filter`。

**其他函数：**

```scss
fn.component-var(button, bg)            // var(--u-button-bg) — 组件级 token
fn.component-var(button, height, 32px)  // var(--u-button-height, 32px) — 带 fallback
fn.use-vars((shadow, border))           // var(--u-shadow) var(--u-border) — 多变量拼接
fn.bem(button, icon, left)              // '.u-button__icon--left' — BEM 选择器字符串
```

---

## 过渡动画

`import '@veltra/styles/transitions'` 注册以下 Vue `<Transition>` name：

| name | 效果 |
|------|------|
| `fade` | 淡入淡出 |
| `slide-down` / `slide-up` | 垂直滑入（10px） |
| `spring` | 弹性缩放入场 |
| `zoom-in` | 中心缩放（0.8→1） |
| `zoom-in-left` / `zoom-in-right` | 水平方向缩放 |
| `zoom-in-top` / `zoom-in-bottom` | 垂直方向缩放 |

```vue
<Transition name="fade" mode="out-in">
  <div v-if="visible">...</div>
</Transition>
```

---

## Normalize

全局 reset 样式（box-sizing、margin 清零、font-family 等），在应用入口处导入一次即可：

```ts
import '@veltra/styles/normalize'
```
