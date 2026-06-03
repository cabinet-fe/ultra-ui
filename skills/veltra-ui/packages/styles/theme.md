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
