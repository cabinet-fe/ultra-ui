# UTheme — 主题编辑器

> `import type { ThemeProps, ThemeExposed } from '@veltra/desktop'`

可视化主题编辑器，用于配置和预览 CSS 变量。通过分类面板按分组编辑色板、表面层次、表单尺度、字体系统和响应断点，支持搜索筛选、基线对比、浅色/深色预设切换及 JSON 导出。

## Import

```ts
import { UTheme } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `theme` | `UITheme` | — | 指定要编辑的主题实例，默认跟随 `currentTheme`（当前已加载主题） |

## Emits

无。

## Slots

无。

## Exposed

```ts
interface ThemeExposed {
  /** 恢复到当前基线主题 */
  reset: () => void
  /** 导出当前主题为 theme-config.json */
  exportTheme: () => void
  /** 应用浅色预设 */
  applyLightPreset: () => void
  /** 应用深色预设 */
  applyDarkPreset: () => void
}
```

## 主题分区

编辑器将变量划分为 5 个面板，合计 49 个可配置项：

| 分区 | key | 说明 | 字段数 |
|------|-----|------|--------|
| 综合色板 | `color` | 品牌色与语义状态色 | 7 |
| 表面层次 | `surface` | 背景、文字、边框与阴影 | 20 |
| 表单尺度 | `control` | 圆角、表单高度、间距 | 9 |
| 字体系统 | `typography` | 字体族与层级字号 | 10 |
| 响应断点 | `responsive` | 响应式布局断点 | 4 |

每个字段对应一个 CSS 变量 `--u-<path>` 和 `theme.<path>` 属性。

## Examples

### 基础用法

```vue
<template>
  <u-theme />
</template>
```

渲染完整的主题编辑面板，编辑当前已加载的主题。

### 编辑指定主题

```vue
<script setup lang="ts">
import { UITheme, lightTheme } from '@veltra/styles/theme'

const customTheme = new UITheme(lightTheme.theme)
</script>

<template>
  <u-theme :theme="customTheme" />
</template>
```

### 通过 Exposed 方法控制

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ThemeExposed } from '@veltra/desktop'

const themeRef = useTemplateRef<ThemeExposed>('theme')

function handleExport() {
  themeRef.value?.exportTheme()
}

function handleReset() {
  themeRef.value?.reset()
}

function handleSwitchToDark() {
  themeRef.value?.applyDarkPreset()
}
</script>

<template>
  <u-theme ref="theme" />
  <u-button @click="handleExport">导出主题</u-button>
  <u-button @click="handleReset">重置</u-button>
  <u-button @click="handleSwitchToDark">深色预设</u-button>
</template>
```

### 搜索与筛选

编辑器内置搜索框（匹配变量名、中文标签、分组名）和「仅看改动」切换按钮，用于快速定位已修改的变量。
