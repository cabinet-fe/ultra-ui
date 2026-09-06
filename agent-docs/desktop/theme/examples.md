---
title: UTheme 主题编辑器示例
description: 用 UTheme 可视化编辑当前主题变量，并通过 Exposed 导出或切换预设
---

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
