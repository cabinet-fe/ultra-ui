---
title: "@veltra/styles/theme 主题加载引擎、预设方案与运行时切换"
description: "运行时主题加载与注入系统：通过 loadTheme 注入 lightTheme / darkTheme 预设或自定义派生主题，自动向 html 节点写入全局 --u-* design tokens 与 data-theme 属性，控制组件色彩与侧栏 nav.variant 风格"
---

从 `@veltra/styles/theme` 加载运行时主题。`loadTheme` 把全局 `--u-*` token 与同系列组件级 token 写到 `html`，并把 `html[data-theme]` 设为该主题的 `series`（`'light'` 或 `'dark'`）。组件样式走 token，不要在业务里写 `[data-theme]` 分支。

## loadTheme

```ts
import { loadTheme, lightTheme, darkTheme } from '@veltra/styles/theme'

loadTheme() // 默认 lightTheme
loadTheme(darkTheme)
```

入口（通常 `main.ts`）调用一次即可。SSR 请在 `onMounted` 里调用，避免无 `document` 时空跑。

`loadTheme` 还会按 `@veltra/compositions` 的 `useConfig().config.size`（`small` / `default` / `large`）给 `html` 加上对应 class，供 normalize 里的字号档位使用。

当前实例挂在 `currentTheme`（`ShallowRef<UITheme | undefined>`）。

## 预设

每个预设自带 `series`，不成对切换：选哪个主题，就是哪种明暗。

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

| 导出 | series | 观感 |
| --- | --- | --- |
| `lightTheme` | `light` | 默认浅色 |
| `heroTheme` | `light` | 紫、大圆角、浮雕阴影；侧栏 `nav.variant` 为 `light` |
| `ancientTheme` | `light` | 松烟绿 + 宣纸底 |
| `sakuraTheme` | `light` | 柔粉 + 花瓣底，大圆角 |
| `oceanTheme` | `light` | 松石青 + 冷白底 |
| `darkTheme` | `dark` | 默认深色 |
| `glassTheme` | `dark` | 玻璃拟态（半透明 + blur） |
| `midnightTheme` | `dark` | 靛蓝 + 深空底 |
| `neonTheme` | `dark` | 品红 + 夜紫底 + 辉光阴影，小圆角 |

## 派生与自定义

`UITheme#new` 深合并局部字段，默认继承基主题的 `series`：

```ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))
```

要从浅色基座做出深色系列，显式传 `series`：

```ts
const myDark = lightTheme.new({ color: { primary: '#ff6600' } }, { series: 'dark' })
loadTheme(myDark)
```

完整 `Theme` 对象用 `new UITheme(theme, options?)`。`options.series` 默认 `'light'`；`options.reactive` 默认 `true`（改 `theme` 字段会自动 `render()`）。

## 侧栏 nav.variant

`UNav` / `UDualNav` / `UGroupNav` 的底色与文字由主题 `nav` 控制，随 `loadTheme` 注入：

- `nav.variant`：`'dark'` 深底浅字 / `'light'` 浅底深字，**默认 `'dark'`**（浅色主题默认侧栏也是深底）。
- `nav` 其余字符串键覆盖同名 `--u-nav-*`（如 `'bg-color'` → `--u-nav-bg-color`），写在变体内置值之后，优先级最高。`ancientTheme` / `sakuraTheme` / `oceanTheme` 的侧栏个性色就是这样写的。

只改底色不改 `variant` 不会联动前景。浅底必须 `variant: 'light'`，否则容易浅底白字。

```ts
import { ancientTheme, loadTheme } from '@veltra/styles/theme'

loadTheme(
  ancientTheme.new({
    nav: { variant: 'light', 'bg-color': '#f1ede0' }
  })
)
```

要整组换成某系列 × 变体的内置侧栏 token，用 `navSidebarTokens`：

```ts
import { loadTheme, navSidebarTokens, type UITheme } from '@veltra/styles/theme'

function withLightSidebar(theme: UITheme) {
  const nav: Record<string, string> = { variant: 'light' }
  for (const [name, value] of Object.entries(navSidebarTokens(theme.series, 'light'))) {
    nav[name.replace(/^--u-nav-/, '')] = value
  }
  return theme.new({ nav })
}

loadTheme(withLightSidebar(ancientTheme))
```

`--u-nav-*` 清单见 `styles/tokens.md`。

## 主题工具（同入口导出）

```ts
import {
  HEXToRGB,
  mixColor,
  hexWithAlpha,
  mixColorWithAlpha,
  hexRgbOnly,
  defineBySize,
  cssVar,
  navSidebarTokens,
  currentTheme,
  UITheme,
  type Theme,
  type ThemeSeries,
  type NavSidebarVariant,
  type RGBColor
} from '@veltra/styles/theme'
```

| 符号 | 用途 |
| --- | --- |
| `HEXToRGB(color)` | `#RGB` / `#RRGGBB` → `[r, g, b]` |
| `mixColor(c1, c2, ratio)` | 两色按 0–1 混合；`ratio > 1` 抛错 |
| `hexWithAlpha(hex, percent)` | `#RRGGBB` + 0–100 → `rgba()` |
| `mixColorWithAlpha(hex, ratio)` | 同上，`ratio` 为 0–1 |
| `hexRgbOnly(hex)` | `#RRGGBBAA` 去掉 alpha |
| `defineBySize({ small, default, large })` | 三档尺寸字段（圆角、字号、表单高度等） |
| `cssVar('text-color-title')` | `'var(--u-text-color-title)'`，TS / 内联样式用 |

SCSS 里优先 `fn.use-var()`，不要手写 `--u-*` 字符串。
