---
title: 主题与暗色
description: 使用 loadTheme 与内置 preset 切换浅色/深色主题，以及派生品牌色与 token 引用
---

组件颜色全部来自 `loadTheme()` 注入的 `--u-*` token。本页只讲 `@veltra/styles/theme` 的公开用法，不涉及主题内部如何生成 CSS。

## 加载主题

```ts
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 等价于 loadTheme(lightTheme)
```

每个主题属于一个系列（`theme.series`）：`'light'` 或 `'dark'`。`loadTheme` 会写入全局 token 与同系列组件级 token，并把 `html[data-theme]` 设为该系列。SSR 在 `onMounted` 中调用。

当前已加载实例可读 `currentTheme`（`ShallowRef<UITheme | undefined>`）。

## 内置 preset

```ts
import {
  loadTheme,
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

loadTheme(heroTheme)
```

| 预设            | 系列  | 说明            |
| --------------- | ----- | --------------- |
| `lightTheme`    | light | 默认浅色        |
| `heroTheme`     | light | 紫、大圆角      |
| `ancientTheme`  | light | 松烟绿 + 宣纸底 |
| `sakuraTheme`   | light | 柔粉、大圆角    |
| `oceanTheme`    | light | 松石青 + 冷白底 |
| `darkTheme`     | dark  | 默认深色        |
| `glassTheme`    | dark  | 玻璃拟态        |
| `midnightTheme` | dark  | 靛蓝 + 深空底   |
| `neonTheme`     | dark  | 品红 + 夜紫底   |

切暗色就是换一个深色系 preset，例如 `loadTheme(darkTheme)`，不要在组件里写 `[data-theme]` 分支。

## 派生与自定义

改品牌主色时从现有主题 `new()` 派生，系列默认继承基主题：

```ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))
```

要把浅色基主题派生成深色，显式传系列：

```ts
const myDark = lightTheme.new({ color: { primary: '#ff6600' } }, { series: 'dark' })
loadTheme(myDark)
```

从完整 `Theme` 对象新建：

```ts
import { loadTheme, UITheme, lightTheme, type Theme } from '@veltra/styles/theme'

const theme: Theme = {
  ...lightTheme.theme,
  color: { ...lightTheme.theme.color, primary: '#ff6600' }
}

loadTheme(new UITheme(theme)) // 默认浅色系；深色传 { series: 'dark' }
```

## 侧栏导航外观

`UNav` / `UDualNav` / `UGroupNav` 的底色与文字色由主题 `nav` 随 `loadTheme` 注入：

- `nav.variant`：`'dark'` 深底浅字 / `'light'` 浅底深字，**默认 `'dark'`**（浅色主题的默认侧栏也是深底）。
- `nav` 的其余键覆盖同名 `--u-nav-*` token（如 `'bg-color'` → `--u-nav-bg-color`）。

改浅色侧栏底时必须同时把 `variant` 设为 `'light'`，否则浅底配白字、菜单看不清：

```ts
import { loadTheme, ancientTheme } from '@veltra/styles/theme'

loadTheme(ancientTheme.new({ nav: { variant: 'light', 'bg-color': '#f1ede0' } }))
```

需要整组覆盖侧栏 token 时用 `navSidebarTokens(series, variant)`，返回键为 `--u-nav-*` 的 `Record`。

## 在代码里引用 token

```ts
import { cssVar } from '@veltra/styles/theme'

cssVar('text-color-title') // 'var(--u-text-color-title)'
cssVar('bg-color-hover') // 'var(--u-bg-color-hover)'
```

模板或内联样式用 `cssVar()` / `var(--u-*)`；不要硬编码颜色、阴影、圆角。SCSS 侧的 mixin 用法见 styles 文档，本配方不展开。
