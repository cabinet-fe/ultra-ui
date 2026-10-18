---
title: loadTheme 运行时主题
description: "从 '@veltra/styles/theme' 导入 loadTheme 与 9 个预设主题：向 html 注入全局与组件级 --u-* CSS 变量并写入 data-theme，支持预设派生自定义主题、深浅色切换、容器级菜单深浅变体与运行时热替换。"
aliases: [theme, UITheme, 主题切换, 暗色模式, 主题定制, 皮肤]
keywords:
  [
    UITheme,
    currentTheme,
    lightTheme,
    darkTheme,
    glassTheme,
    series,
    nav.variant,
    nav.variants,
    navSidebarTokens,
    navSidebarColors,
    navSurfaceTone,
    navSurfaceTokens,
    withNavVariant,
    data-nav-variant,
    data-nav-surface,
    data-theme,
    --u-,
    深色模式,
    暗色模式,
    主题定制,
    热替换,
    设计令牌,
    侧栏外观,
    菜单深浅,
    换肤
  ]
---

# loadTheme 运行时主题

`@veltra/styles/theme` 导出主题加载函数 `loadTheme`、9 个预设主题（`UITheme` 实例）与主题工具函数。`loadTheme` 把主题对象编译成 `html { --u-*: ... }` 声明注入文档，并按主题 `series` 写入 `html[data-theme]`（`'light'` 或 `'dark'`）；组件样式只消费 `--u-*` token，业务代码不做 `[data-theme]` 分支。

除全局 token 外，主题还注入：

- **容器级菜单变体**：`html[data-theme] [data-nav-variant='dark'|'light']` 两套规则，任意子树加 `data-nav-variant` 即可切换菜单深浅，**无需重建主题**；
- **菜单实际底色色调**：`html[data-nav-surface='dark'|'light']`，深色系列的任何变体都是深底（light 变体只是提亮一档），供应用壳按底色选描边/叠层。见 [tokens.md](tokens.md) 的 nav 组。

## 快速上手

应用入口先导入 normalize，再调用 `loadTheme()`。不调用 `loadTheme` 时 `html` 上没有任何 `--u-*` 变量，组件没有颜色：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 不传参时应用 lightTheme
```

`loadTheme` 是同步函数，重复调用以最后一次为准（这就是运行时热替换：注入的声明块被整体替换，颜色立即生效，无需刷新）。

SSR 环境必须在 `onMounted` 中调用；服务端调用不会报错（内部跳过 DOM 操作），但也不会产出样式。

## API 签名

```ts
import type { ShallowRef } from 'vue'

/** 主题系列：浅色或深色。决定注入哪套组件级 token，并写入 html[data-theme] */
export type ThemeSeries = 'light' | 'dark'

/** Theme 的深层 Partial，用于派生主题 */
type RecursivePartial<T> = { [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P] }

export interface UIThemeOptions {
  /** 主题变更时是否自动重渲染（deep watch theme）。默认 true */
  reactive?: boolean
  /** 主题所属系列。默认 'light' */
  series?: ThemeSeries
}

export class UITheme {
  /** 回退 <style> 标签的 id（不支持 adoptedStyleSheets 的环境） */
  static themeID: string // 'ultra-ui-theme'
  readonly theme: Theme
  series: ThemeSeries
  constructor(theme: Theme, options?: UIThemeOptions)
  /**
   * 注入主题：全局 token + 与 series 匹配的组件级 token + nav 侧栏外观，并写 html[data-theme]；
   * 同时注入容器级菜单变体规则（[data-nav-variant]）与实际底色色调（html[data-nav-surface]）。同步、无返回值
   */
  render(): void
  /**
   * 派生新主题：customTheme 与基主题深合并，空值（''、null、undefined）字段被剔除，0 保留；
   * 继承基主题的 reactive 与 series（options.series 可覆盖）。同步，返回新 UITheme，不修改基主题
   */
  new(customTheme?: RecursivePartial<Theme>, options?: { series?: ThemeSeries }): UITheme
  /**
   * nav 侧栏外观声明列表：默认按 nav.variant（未声明时 'dark'）取内置 token；
   * nav 顶层字符串键对所有变体生效，nav.variants[variant] 只对该变体生效（优先级最高）。
   * @param variant 显式指定变体（容器级/预览取色用）
   */
  navSidebarDecls(theme: Theme, variant?: 'dark' | 'light'): string[]
  /** 派生指定菜单变体的主题（等价 new({ nav: { variant } })，变体专属外观由 nav.variants 声明） */
  withNavVariant(variant: 'dark' | 'light'): UITheme
  /**
   * 解析当前主题某菜单变体的具体色值（键为去掉 --u-nav- 前缀的 token 名，
   * 如 'bg-color' / 'active-color' / 'surface-hairline'），用于主题选择器预览等场景
   */
  navSidebarColors(variant?: 'dark' | 'light'): Record<string, string>
  /** 主题变量声明列表（--u-* 自定义属性），含色阶、alpha、简写等派生 token */
  themeToDeclarationList(theme: Theme): string[]
}

/** 某主题系列 + 菜单变体下侧栏的实际底色色调（深色系列任何变体都是 dark） */
export function navSurfaceTone(series: ThemeSeries, variant: 'dark' | 'light'): 'dark' | 'light'

/** 某主题系列 + 菜单变体下的 nav 外观 token（--u-nav-*，含表面装饰） */
export function navSidebarTokens(
  series: ThemeSeries,
  variant: 'dark' | 'light'
): Record<string, string>

/** 某主题系列 + 菜单变体下的 nav 表面装饰 token（--u-nav-surface-*） */
export function navSurfaceTokens(
  series: ThemeSeries,
  variant: 'dark' | 'light'
): Record<string, string>

/** 当前已加载主题。loadTheme 之前为 undefined */
export const currentTheme: ShallowRef<UITheme | undefined>

/** 加载主题并注入文档。默认 lightTheme；同步，无返回值，不抛错 */
export function loadTheme(theme?: UITheme): void
```

### 主题对象 Theme

组件级 `--u-*`（table、tag、nav 尺寸等）不在 `Theme` 里，由内置表随 `loadTheme` 按系列注入；`Theme` 只描述全局 token 与少量组件级扩展键：

```ts
export type Theme = {
  /** 主题色（7 个语义色） */
  color: {
    primary: string
    success: string
    warning: string
    danger: string
    info: string
    disabled: string
    default: string
  }
  /** 背景：五层底色 + 背景滤镜 */
  bg: {
    color: { bottom: string; middle: string; top: string; hover: string; black: string }
    filter: { blur: string; saturate: string }
  }
  border: {
    color: string // 结构性边框（分隔线），始终可见
    mutedColor: string // 弱化边框（表单控件描边）
    width: number
    style: string
  }
  /** 文字色（7 个层级） */
  'text-color': {
    title: string
    main: string
    placeholder: string
    second: string
    assist: string
    disabled: string
    white: string
  }
  /** 圆角，单位 px */
  radius: { small: number; default: number; large: number }
  /** 表单组件高度，单位 px */
  'form-component-height': { small: number; default: number; large: number }
  'font-family': string
  'font-size-title': { small: number; default: number; large: number }
  'font-size-main': { small: number; default: number; large: number }
  'font-size-assist': { small: number; default: number; large: number }
  /** 阴影：x/y/blur/spread 合成 --u-shadow；sm 贴面、lg 浮层；emboss 非浮雕主题为 'none' */
  shadow: {
    color: string
    x: number
    y: number
    blur: number
    spread: number
    emboss: string
    sm: string
    lg: string
  }
  /** 动效；值须带单位或为合法 CSS 字符串，数字写入时会被补 px */
  transition: { fast: string; normal: string; slow: string; ease: string; easeOut: string }
  /** 间距，单位 px */
  gap: { small: number; default: number; large: number }
  /** 断点，单位 px */
  breakpoint: { xs: number; sm: number; md: number; lg: number }
  /** 组件级扩展键：路径转 kebab 后即 --u-* token（button['default-bg'] → --u-button-default-bg） */
  button?: { 'default-bg'?: string; [key: string]: any }
  /**
   * 侧栏导航（nav / dual-nav / group-nav）组件级变量。
   * variant 是默认外观；variants 可为两个变体分别定制；顶层其余字符串键对所有变体生效并覆盖同名 --u-nav-*
   */
  nav?: {
    variant?: 'dark' | 'light'
    variants?: Partial<Record<'dark' | 'light', Record<string, string>>>
    [key: string]: any
  }
  collapse?: { 'title-color'?: string; [key: string]: any }
  [key: string]: any
}
```

### 预设主题

9 个预设按系列组织，每个自带 `series`，不成对切换——选哪个主题就是哪种明暗：

```ts
import {
  lightTheme,
  heroTheme,
  ancientTheme,
  sakuraTheme,
  oceanTheme,
  darkTheme,
  glassTheme,
  midnightTheme,
  neonTheme
} from '@veltra/styles/theme'
```

| 导出            | series  | 特征（源码注释）                                                      |
| --------------- | ------- | --------------------------------------------------------------------- |
| `lightTheme`    | `light` | 默认浅色基座，`reactive: false`                                       |
| `heroTheme`     | `light` | HeroUI 风格：紫 `#7828c8`、2px 边框、浮雕阴影、`nav.variant: 'light'` |
| `ancientTheme`  | `light` | 松烟绿 + 宣纸底，侧栏松烟墨                                           |
| `sakuraTheme`   | `light` | 柔粉 + 花瓣底、大圆角、弹性缓动，侧栏深酒红                           |
| `oceanTheme`    | `light` | 松石青 + 冷白底，侧栏深海礁                                           |
| `darkTheme`     | `dark`  | 默认深色基座                                                          |
| `glassTheme`    | `dark`  | 玻璃拟态：rgba 背景 + `blur(20px)`，显式声明 kbd / batch-edit 扩展键  |
| `midnightTheme` | `dark`  | 靛蓝 + 深空底，宽松间距、舒缓过渡                                     |
| `neonTheme`     | `dark`  | 品红 + 夜紫底 + 辉光阴影，小圆角                                      |

预设的个性化侧栏色写在 `nav.variants[variant]`（如古风/樱花/海盐的深墨侧栏），因此切到另一个变体时会自动回落到该主题系列的内置浅/深外观，不会出现「浅变体套深墨底」的串色。

### 主题工具函数（同入口导出）

```ts
import {
  HEXToRGB, // (color: string) => [number, number, number]
  mixColor, // (color1: `#${string}`, color2: `#${string}`, ratio: number) => string
  hexWithAlpha, // (hex: `#${string}`, alphaPercent: number) => string
  mixColorWithAlpha, // (hex: `#${string}`, ratio: number) => string
  hexRgbOnly, // (hex: string) => `#${string}`（剥掉 #RRGGBBAA 的 alpha）
  isHexColor, // (value: string) => value is `#${string}`
  defineBySize, // (<T extends { small: number; default: number; large: number }>(v: T) => T)
  cssVar, // (prop: string) => string；cssVar('text-color-title') === 'var(--u-text-color-title)'
  themeTokenVar, // (basename: string, ...nodes: Array<string | number>) => string
  navSidebarTokens, // (series, variant) => Record<string, string>，含 --u-nav-* 外观 + 表面装饰
  navSurfaceTokens, // (series, variant) => Record<string, string>，仅 --u-nav-surface-*
  navSurfaceTone, // (series, variant) => 'dark' | 'light'，侧栏实际底色色调
  resolveNavSidebarDecls // (series, variant) => string[]
} from '@veltra/styles/theme'
```

`mixColor(color1, color2, ratio)` 在 `ratio > 1` 时抛出 `Error('ratio的值在0-1之间')`。

## 参数说明

### loadTheme

| 参数    | 类型      | 默认         | 必填 | 约束                                          |
| ------- | --------- | ------------ | :--: | --------------------------------------------- |
| `theme` | `UITheme` | `lightTheme` |  否  | 预设实例或 `UITheme` / `UITheme#new` 的返回值 |

调用行为（按序）：

1. 写入 `currentTheme.value`
2. 无 `document`（SSR）时到此为止，直接返回
3. 读取 `useConfig().config.size`，在 `html` 上移除其余尺寸 class、添加当前 class（`small` / `default` / `large`，normalize 据此切三档正文字号）
4. 执行 `theme.render()` 注入声明、写 `html[data-theme]` 与 `html[data-nav-surface]`，并注入容器级菜单变体规则（`[data-nav-variant]`）

### UITheme 构造参数

| 参数               | 类型                | 默认      | 必填 | 约束                                                  |
| ------------------ | ------------------- | --------- | :--: | ----------------------------------------------------- |
| `theme`            | `Theme`             | —         |  是  | 完整主题对象；`render` 内部用 `toRaw` 读取            |
| `options.reactive` | `boolean`           | `true`    |  否  | `true` 时 deep watch `theme`，字段变更自动 `render()` |
| `options.series`   | `'light' \| 'dark'` | `'light'` |  否  | 决定组件级 token 套别与 `html[data-theme]`            |

### Theme 配置组与默认值（lightTheme 基线）

| 配置组                                                    | 类型                                            | 默认值                                                                                                                                     | 必填 | 约束                                                                                                               |
| --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | :--: | ------------------------------------------------------------------------------------------------------------------ |
| `color.primary`                                           | `string`                                        | `'#2563eb'`                                                                                                                                |  是  | 其余：success `'#16a34a'`、warning `'#d97706'`、danger `'#dc2626'`、info `'#0891b2'`、disabled/default `'#f4f4f5'` |
| `bg.color.*`                                              | `string`                                        | bottom `'#f4f4f5'`、middle `'#fafafa'`、top `'#ffffff'`、hover `'#f4f4f5'`、black `'#000000'`                                              |  是  | 非十六进制值（rgba 等）不生成 alpha 派生 token                                                                     |
| `bg.filter`                                               | `{ blur: string; saturate: string }`            | `'none'` / `'none'`                                                                                                                        |  是  | 合成 `--u-bg-filter`；blur 为 `'none'` 时整体 `'none'`                                                             |
| `border`                                                  | `{ color; mutedColor; width; style }`           | `'#e4e4e7'`、`'#d4d4d8'`、`1`、`'solid'`                                                                                                   |  是  | width 数字补 px                                                                                                    |
| `text-color.*`                                            | `string`                                        | title `'#18181b'`、main `'#3f3f46'`、placeholder `'#a1a1aa'`、second `'#71717a'`、assist `'#d4d4d8'`、disabled `'#a1a1aa'`、white `'#fff'` |  是  | —                                                                                                                  |
| `radius`                                                  | `{ small; default; large }`                     | `6` / `8` / `12`                                                                                                                           |  是  | 数字补 px                                                                                                          |
| `form-component-height`                                   | `{ small; default; large }`                     | `24` / `32` / `40`                                                                                                                         |  是  | 数字补 px                                                                                                          |
| `font-family`                                             | `string`                                        | system-ui 栈                                                                                                                               |  是  | —                                                                                                                  |
| `font-size-title` / `font-size-main` / `font-size-assist` | `{ small; default; large }`                     | 14/16/18、12/14/16、12/12/14                                                                                                               |  是  | 数字补 px                                                                                                          |
| `shadow`                                                  | `{ color; x; y; blur; spread; emboss; sm; lg }` | `'#00000014'`、`0/1/3/0`、`'none'`、sm/lg 完整 box-shadow                                                                                  |  是  | —                                                                                                                  |
| `transition`                                              | `{ fast; normal; slow; ease; easeOut }`         | `'0.15s'`、`'0.25s'`、`'0.35s'`、两条 cubic-bezier                                                                                         |  是  | `easeOut` 写入为 `--u-transition-ease-out`                                                                         |
| `gap`                                                     | `{ small; default; large }`                     | `6` / `8` / `12`                                                                                                                           |  是  | 数字补 px                                                                                                          |
| `breakpoint`                                              | `{ xs; sm; md; lg }`                            | `600` / `960` / `1280` / `1920`                                                                                                            |  是  | 数字补 px                                                                                                          |
| `nav.variant`                                             | `'dark' \| 'light'`                             | `'dark'`                                                                                                                                   |  否  | 其余字符串键逐项覆盖 `--u-nav-*`                                                                                   |
| `button` / `collapse` / 其他扩展键                        | `object`                                        | —                                                                                                                                          |  否  | 路径转 kebab 后即组件级 `--u-*` token                                                                              |

## 方法与事件

`loadTheme` 无事件。`UITheme` 实例方法均为同步：

- `render()`：同步，无返回值，不抛错。支持 `adoptedStyleSheets` 的浏览器用 `CSSStyleSheet.replaceSync` 整体替换声明；否则更新 `<style id="ultra-ui-theme">`。每次调用重写 `html[data-theme]`。
- `new(customTheme?, options?)`：同步，返回新的 `UITheme`，不修改原主题；派生主题继承 `reactive` 与 `series`。所有预设都由 `lightTheme.new` / `darkTheme.new` 派生，因此预设及其派生链的 `reactive` 均为 `false`。
- `navSidebarDecls(theme)` / `themeToDeclarationList(theme)`：同步，返回 `string[]`（`'--u-xxx: value'` 形式），供调试或自定义注入。

## 典型示例

### 深浅色切换（运行时热替换）

```ts
// src/theme-toggle.ts
import { currentTheme, darkTheme, lightTheme, loadTheme } from '@veltra/styles/theme'

export function toggleScheme(): void {
  // currentTheme 为 ShallowRef<UITheme | undefined>，loadTheme 之前是 undefined
  const next = currentTheme.value?.series === 'dark' ? lightTheme : darkTheme
  loadTheme(next)
}

toggleScheme()
// => html[data-theme="dark"]，全部 --u-* 换成深色系；再调一次回到 light
```

热替换不刷新页面：`render()` 用同一张 adopted stylesheet 整体替换声明，颜色、阴影、动效立即切换。

### 派生自定义主题（品牌色与深色派生）

```ts
import { lightTheme, loadTheme } from '@veltra/styles/theme'

// 基于预设派生：深合并，只写要覆盖的字段；series 默认继承基主题（此处 'light'）
const brandTheme = lightTheme.new({ color: { primary: '#ff6600' } })
loadTheme(brandTheme) // => 主色及全部色阶、alpha token 同步变为 #ff6600 系

// 从浅色基座派生深色系列必须显式声明 series，否则组件级 token 仍是浅色套
const brandDark = lightTheme.new({ color: { primary: '#ff6600' } }, { series: 'dark' })
loadTheme(brandDark) // => html[data-theme="dark"]，表格、按钮等按深色组件 token 注入
```

预设及其派生主题 `reactive` 为 `false`：运行中直接改 `theme.xxx` 不会自动重渲染，改完再调一次 `loadTheme(theme)`。需要响应式主题时用 `new UITheme(theme)`（默认 `reactive: true`，deep watch，改字段即自动 `render()`）。

### 侧栏导航外观（菜单深浅）

每个主题都有「主题系列 × 菜单变体」两套内置 nav 外观：深色变体（深底浅字）与浅色变体（浅底深字）。深色系列主题的 light 变体是「比内容区提亮一档的深色面板」，前景仍为浅色。

**方式一：容器级变体（推荐，不重建主题）** —— 任意子树加 `data-nav-variant`，随主题自动取对应系列的内置 token：

```vue
<!-- 侧栏容器：整个侧栏（含品牌、菜单、用户区）都继承这套 nav token -->
<aside class="app-sidebar" data-nav-variant="light">
  <u-nav :menus="menus" current-path="/workbench" />
</aside>
```

`loadTheme` 会为四种组合注入规则（`html[data-theme='light'] [data-nav-variant='dark']` 等），所以同一页面里可以并存不同深浅的导航区域；切换变体只改属性，不用重新 `loadTheme`。

**方式二：派生主题（整页统一）** —— 用 `withNavVariant` 派生，切换时重新加载：

```ts
import { ancientTheme, loadTheme } from '@veltra/styles/theme'

loadTheme(ancientTheme.withNavVariant('light'))
```

**为预设定制某个变体的颜色**：写在 `nav.variants[variant]`，只在该变体生效（预设个性的深侧栏色因此不会泄漏到浅变体）；`nav` 顶层字符串键仍然对所有变体生效：

```ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

loadTheme(
  lightTheme.new({
    nav: {
      'hover-bg': 'rgba(0, 0, 0, 0.05)', // 两个变体都生效
      variants: {
        dark: { 'bg-color': '#101418' }, // 只有深色菜单生效
        light: { 'bg-color': '#f5f6f8' } // 只有浅色菜单生效
      }
    }
  })
)
```

**取具体色值（主题选择器预览）**：`navSidebarColors(variant?)` 把内置 token 的 `var()` 引用解析成当前主题下的具体色值，不依赖该主题是否已加载到 DOM：

```ts
const theme = ancientTheme // UITheme 实例
theme.navSidebarColors()['bg-color'] // 默认（深）变体的侧栏底色，如 '#303c34'
theme.navSidebarColors('light')['bg-color'] // 浅变体的侧栏底色，如 '#f7f4ea'
theme.navSidebarColors('light')['active-color'] // 选中项文字色（已解析为 hex）
```

> [!TIP]
> 应用壳绘制侧栏容器（叠层渐变、分隔线、chip、品牌标记环、选中态、滚动条）不需要自己算深浅：内置 `--u-nav-surface-*` token 已按实际底色色调（`dark` / `light`）给出配套值；色调也可用 `navSurfaceTone(series, variant)` 或 `html[data-nav-surface]` 获取。token 清单见 [tokens.md](tokens.md) 的 nav 组。

## 注意事项

> [!WARNING]
>
> - 入口必须调用 `loadTheme()`：不调用时 `--u-*` 变量为空，组件没有颜色。这是本库唯一的主题初始化入口。
> - `theme` 运行时依赖 `@veltra/compositions` 的 `useConfig`（`loadTheme` 读取 `config.size` 同步 `html` 尺寸 class）；`@veltra/compositions` 禁止 re-export `theme`，否则两个包循环依赖。主题 API 一律从 `@veltra/styles/theme` 导入，不从 compositions 导入。
> - 本库的深浅色切换是「换一个带目标 `series` 的主题」，不是给 `html` 加 `dark` 类；组件 SCSS 暗色分支用 `@include m.dark`（匹配 `html[data-theme='dark']`），但优先换 token 而不是写分支。
> - 深色派生必须写 `{ series: 'dark' }`；不写时全局色变了，但表格斑马纹、按钮 plain 等组件级 token 仍按浅色注入。
> - **菜单深浅不要只改 `nav['bg-color']`**：只改底色不联动前景会出现浅底白字。要么用容器级 `data-nav-variant`（推荐），要么 `withNavVariant()` 派生；预设定制色写在 `nav.variants[variant]`，避免泄漏到另一个变体。
> - `html[data-nav-surface]` 是当前主题默认菜单变体的**实际底色色调**，深色系列恒为 `dark`；`data-nav-variant` 的切换不改变它（容器级变体由 `--u-nav-surface-*` token 覆盖）。
> - 值为 `''`、`null`、`undefined` 的字段在 `new()` 派生时被剔除，`0` 保留；数字 token 写入时自动补 `px`。
> - 非 hex 颜色（如 glassTheme 的 `rgba()` 背景）不生成对应 alpha / 混合派生 token，需要时在主题里用扩展键显式声明（glassTheme 的 `kbd` / `batch-edit` 就是这种写法）。

## 常见问题

### 组件全部无颜色，`html` 上查不到 `--u-*`

原因：入口没有调用 `loadTheme`。修复：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

### 换了深色主题，全局色变了但表格 / 按钮外观还是浅色那套

原因：该主题 `series` 是 `'light'`（例如 `lightTheme.new({...})` 未传系列）。修复：

```ts
import { lightTheme, loadTheme } from '@veltra/styles/theme'

loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }, { series: 'dark' }))
```

### 报错 `Error: ratio的值在0-1之间`

原因：调用 `mixColor(c1, c2, ratio)` 时 `ratio > 1`。修复：`ratio` 取 0~1（如 `0.25` 表示 25% 向第二色混合）。
