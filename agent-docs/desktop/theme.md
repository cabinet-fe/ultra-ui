---
title: "UTheme - 主题编辑器"
description: "用 UTheme 可视化编辑当前主题变量，并通过 Exposed 导出或切换预设"
keywords:
  - UTheme
  - @veltra/desktop
  - theme
  - Theme
  - 主题编辑器
aliases: ["theme", "UTheme", "Theme", "主题编辑器"]
---
## 快速上手

```ts
import { UTheme } from '@veltra/desktop'
```

## 典型示例

`UTheme` 默认编辑已经 `loadTheme` 过的当前主题。传入 `theme` 可指定要编辑的 `UITheme` 实例。组件暴露 `reset`、`exportTheme`、`applyLightPreset`、`applyDarkPreset`。应用主题本身用 `@veltra/styles/theme` 的 `loadTheme`，见配方 `recipes/theme.md`。

```vue
<script setup lang="ts">
import type { ThemeExposed } from '@veltra/desktop'
import { useTemplateRef } from 'vue'

const themeRef = useTemplateRef<ThemeExposed>('theme')
</script>

<template>
  <u-theme ref="theme" />
  <u-button @click="themeRef?.applyLightPreset()">浅色预设</u-button>
  <u-button @click="themeRef?.applyDarkPreset()">深色预设</u-button>
  <u-button @click="themeRef?.reset()">重置</u-button>
  <u-button type="primary" @click="themeRef?.exportTheme()">导出</u-button>
</template>
```

指定要编辑的主题实例：

```vue
<script setup lang="ts">
import { UITheme, lightTheme } from '@veltra/styles/theme'

const custom = new UITheme(lightTheme.theme)
</script>

<template>
  <u-theme :theme="custom" />
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { UITheme } from '@veltra/styles/theme'
/** 主题组件属性 */
export interface ThemeProps {
  /** 指定要编辑的主题实例，默认跟随当前已加载主题 */
  theme?: UITheme
}

/** 主题组件暴露的属性和方法(组件内部使用) */
export interface _ThemeExposed {
  /** 恢复到当前基线主题 */
  reset: () => void
  /** 导出当前主题 */
  exportTheme: () => void
  /** 应用浅色预设 */
  applyLightPreset: () => void
  /** 应用深色预设 */
  applyDarkPreset: () => void
}

/** 主题组件暴露的属性和方法 */
export type ThemeExposed = DeconstructValue<_ThemeExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
