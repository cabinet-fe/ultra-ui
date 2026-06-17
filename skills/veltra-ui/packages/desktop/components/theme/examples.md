# UTheme 示例

## 基础用法

```vue
<template>
  <u-theme />
</template>
```

## 编辑指定主题

```vue
<script setup lang="ts">
import { UITheme, lightTheme } from '@veltra/styles/theme'

const customTheme = new UITheme(lightTheme.theme)
</script>

<template>
  <u-theme :theme="customTheme" />
</template>
```

## 通过 Exposed 方法控制

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const themeRef = useTemplateRef('theme')

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
