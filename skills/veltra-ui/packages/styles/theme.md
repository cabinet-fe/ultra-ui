# Theme

从 `@veltra/styles/theme` 导入。优先使用内置预设主题；需要品牌差异时再派生或自定义主题。

## 主题模型

每个主题都属于一个**系列**（`series`）：`'light'`（浅色系）或 `'dark'`（深色系）。主题不成对——有的主题天生适合浅色，有的天生适合深色。应用主题即确定明暗：`loadTheme` 会注入全局 token 与同系列的组件级 token，并把 `html[data-theme]` 置为对应系列。

## 使用内置主题

```ts
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 等价于 loadTheme(lightTheme)
```

SSR 中在 `onMounted` 内调用。

## 使用预设主题

```ts
import { loadTheme, heroTheme, glassTheme } from '@veltra/styles/theme'

loadTheme(heroTheme)
// 或
loadTheme(glassTheme)
```

可导入的预设：

```ts
import {
  // 浅色系
  lightTheme, // 默认浅色
  heroTheme, // HeroUI 风格（紫、大圆角、浮雕阴影）
  ancientTheme, // 古风（松烟绿 + 宣纸底）
  sakuraTheme, // 樱花（柔粉 + 花瓣底，大圆角）
  oceanTheme, // 海盐（松石青 + 冷白底）
  // 深色系
  darkTheme, // 默认深色
  glassTheme, // 玻璃拟态（半透明 + backdrop blur）
  midnightTheme, // 午夜（靛蓝 + 深空底）
  neonTheme // 霓虹（品红 + 夜紫底 + 辉光阴影，小圆角）
} from '@veltra/styles/theme'
```

## 派生主题

```ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))
```

`new()` 派生会继承基主题的系列；派生深色主题需显式声明：

```ts
const myDark = lightTheme.new({ ... }, { series: 'dark' })
```

## 自定义主题

```ts
import { loadTheme, UITheme, lightTheme, type Theme } from '@veltra/styles/theme'

const theme: Theme = {
  ...lightTheme.theme,
  color: { ...lightTheme.theme.color, primary: '#ff6600' }
}

loadTheme(new UITheme(theme)) // 默认浅色系；深色主题传 { series: 'dark' }
```

## 侧栏导航外观

侧栏导航组件（nav / dual-nav / group-nav）的底色与文字色由主题 `nav` 配置控制，随 `loadTheme` 一并注入：

- `nav.variant`：`'dark'` 深底浅字 / `'light'` 浅底深字，**默认 `'dark'`**（浅色主题的默认侧栏也是深底）。按「主题系列 × 变体」选用内置 token 组。
- `nav` 的其余键覆盖同名 `--u-nav-*` token（如 `'bg-color'` → `--u-nav-bg-color`），追加在变体内置值之后，优先级最高。内置预设的侧栏个性色（古风深墨、樱花深酒红）即通过该机制定义。

> **注意**：`bg-color` 等覆盖不会联动前景色。把侧栏改成浅色底时必须同时把 `variant` 设为 `'light'`，否则会出现浅底配白字、菜单文字看不清的问题。

古风主题改宣纸色侧栏：

```ts
loadTheme(ancientTheme.new({
  nav: { variant: 'light', 'bg-color': '#f1ede0' }
}))
```

派生主题时若要强制某个变体、抹掉预设的侧栏个性色，用 `navSidebarTokens` 展开整套 token 再逐个覆盖，保证前景/底色配套：

```ts
import { navSidebarTokens } from '@veltra/styles/theme'

const nav: Record<string, string> = { variant: 'light' }
for (const [name, value] of Object.entries(navSidebarTokens(theme.series, 'light'))) {
  nav[name.replace(/^--u-nav-/, '')] = value
}
loadTheme(theme.new({ nav }))
```

可用的 `--u-nav-*` token 清单见 `./tokens.md`。

## API 一览

| 用法                                  | 效果                                        |
| ------------------------------------- | ------------------------------------------- |
| `loadTheme()`                         | 注入默认浅色主题                            |
| `loadTheme(theme)`                    | 注入指定主题，写入 `data-theme` 为其系列    |
| `theme.new(partialTheme, options?)`   | 基于现有主题派生，`options.series` 可换系列 |
| `new UITheme(completeTheme, options)` | 从完整 `Theme` 对象创建主题                 |
| `theme.series`                        | 主题所属系列（`'light' \| 'dark'`）         |

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
  navSidebarTokens,
  currentTheme,
  type RGBColor,
  type NavSidebarVariant,
  type Theme,
  type ThemeSeries
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

### `navSidebarTokens(series, variant)`

返回指定「主题系列 × 侧栏变体」下的整套 nav 外观 token（键为 `--u-nav-*` 的 `Record`），用于派生主题时整组覆盖侧栏外观。用法见「侧栏导航外观」。

### `currentTheme`

`ShallowRef<UITheme | undefined>`，指向当前已加载主题实例。
