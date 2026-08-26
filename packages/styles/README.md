# 样式系统

样式系统主要包含以下内内容：

- 规范化样式
- 预设的 Vue3 过渡样式
- 主题系统
- scss 工具

## 规范化样式

通常在 `main.ts` 中导入 `normalize` 样式：

```ts
import '@veltra/styles/normalize'
```

## 预设的 Vue3 过渡样式

### 全部导入

可以在 `main.ts` 中全局导入:

```ts
import '@veltra/styles/transitions'
```

### 单独导入

如果对体积有严格要求，不想导入未使用的过渡效果，可以在局部使用以下导入的方式

```ts
import '@veltra/styles/transitions/fade.css'
```

## scss 工具

本包提供了一些常用的 `scss` 工具，包括常用的 `mixins` 与 常用的 `functions`, 你还可以通过覆盖变量 $namespace 来使用当前库的同一套工具体系，只不过是命名空间不一样。

## 主题加载以及切换

从 `@veltra/styles/theme` 导入预设主题，在入口（SSR 则在 `onMounted`）调用 `loadTheme`：

```ts
import { loadTheme, lightTheme, heroTheme, glassTheme } from '@veltra/styles/theme'

loadTheme() // 默认 lightTheme
loadTheme(heroTheme) // 应用指定预设
```

预设主题按系列组织，应用主题即确定明暗（`html[data-theme]` 同步写入）：

- 浅色系：`lightTheme`、`heroTheme`、`ancientTheme`
- 深色系：`darkTheme`、`glassTheme`

基于预设派生自定义主题：

```ts
loadTheme(lightTheme.new({ color: { primary: '#ff6600' } }))
```

深色派生需声明系列：`lightTheme.new({...}, { series: 'dark' })`。
