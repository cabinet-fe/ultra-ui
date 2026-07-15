# Theme

从 `@veltra/styles/theme` 导入。优先使用内置预设主题；需要品牌差异时再派生或自定义主题。

## 使用内置主题

```ts
import { loadTheme, setTheme } from '@veltra/styles/theme'

loadTheme()

setTheme('dark')
setTheme('light')
setTheme('auto')
```

`loadTheme()` 注入内置 light/dark 主题，支持 `setTheme()` 和系统暗色偏好。SSR 中在 `onMounted` 内调用。

## 使用预设主题

```ts
import { loadTheme, glassLightTheme, heroLightTheme } from '@veltra/styles/theme'

loadTheme(heroLightTheme)
// 或
loadTheme(glassLightTheme)
```

可导入的预设：

```ts
import {
  lightTheme,
  darkTheme,
  shadcnLightTheme,
  shadcnDarkTheme,
  heroLightTheme,
  heroDarkTheme,
  glassLightTheme,
  glassDarkTheme
} from '@veltra/styles/theme'
```

## 派生主题

```ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))
```

## 自定义主题

```ts
import { loadTheme, UITheme, lightTheme, type Theme } from '@veltra/styles/theme'

const theme: Theme = {
  ...lightTheme.theme,
  color: { ...lightTheme.theme.color, primary: '#ff6600' }
}

loadTheme(new UITheme(theme))
```

## 用法差异

| 用法                           | 效果                                 |
| ------------------------------ | ------------------------------------ |
| `loadTheme()`                  | 注入内置 light/dark，支持 `setTheme` |
| `loadTheme(lightTheme)`        | 注入内置 light/dark，并切到 light    |
| `loadTheme(darkTheme)`         | 注入内置 light/dark，并切到 dark     |
| `loadTheme(glassLightTheme)`   | 单主题注入，不支持 `setTheme` 切换   |
| `lightTheme.new(partialTheme)` | 基于现有主题派生                     |
| `new UITheme(completeTheme)`   | 从完整 `Theme` 对象创建主题          |

## 主题工具函数

从 `@veltra/styles/theme` 一并导出，用于自定义/派生主题或在 TS 中引用主题 CSS 变量。

```ts
import {
  HEXToRGB,
  mixColor,
  hexWithAlpha,
  mixColorWithAlpha,
  hexRgbOnly,
  defineBySize,
  cssVar,
  currentTheme,
  type RGBColor,
  type Theme
} from '@veltra/styles/theme'
```

### `HEXToRGB(color)`

将十六进制颜色转为 RGB 元组 `[r, g, b]`。支持 `#RGB` 与 `#RRGGBB`。

```ts
HEXToRGB('#f60') // [255, 102, 0]
HEXToRGB('#ff6600') // [255, 102, 0]
```

### `mixColor(color1, color2, ratio)`

按 `ratio`（0–1）混合两个 `#RRGGBB` 颜色，返回混合后的十六进制颜色。`ratio > 1` 时抛错。

```ts
mixColor('#ffffff', '#000000', 0.5) // '#808080'
```

内置主题在生成 `primary/success/...` 的 light/dark 色阶时会用到。

### `hexWithAlpha(hex, alphaPercent)` / `mixColorWithAlpha(color, ratio)`

`#RRGGBB` + 不透明度 → `rgba()`。`hexWithAlpha` 的 `alphaPercent` 为 0–100；`mixColorWithAlpha` 的 `ratio` 为 0–1（等价于百分比）。

```ts
hexWithAlpha('#ff6600', 8) // 'rgba(255, 102, 0, 0.08)'
mixColorWithAlpha('#ff6600', 0.08) // 同上
```

### `hexRgbOnly(hex)`

剥离 `#RRGGBBAA` 的 alpha，返回 `#RRGGBB`。

```ts
hexRgbOnly('#ff660080') // '#ff6600'
```

### `defineBySize(variable)`

为 `small` / `default` / `large` 三档尺寸声明主题数值，用于 `Theme` 中带尺寸语义的 token（如 `radius`、`form-component-height`、`font-size-main`）。

```ts
defineBySize({ small: 24, default: 32, large: 40 })
// => { small: 24, default: 32, large: 40 }
```

类型上约束三档键必须齐全；自定义 preset 时与内置 `lightTheme` 写法一致。

### `cssVar(prop)`

生成全局主题 CSS 变量引用（`--u-*` 命名空间）。`prop` 为与 `Theme` 结构对应的连字符路径。

```ts
cssVar('text-color-title') // 'var(--u-text-color-title)'
cssVar('bg-color-hover') // 'var(--u-bg-color-hover)'
```

在 TS/内联样式中引用主题 token；SCSS 中优先用 `fn.use-var()`（见 `./scss.md`）。

### `currentTheme`

`ShallowRef<UITheme | undefined>`，指向当前已加载主题实例。
