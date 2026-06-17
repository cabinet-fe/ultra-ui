# USlider 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref(50)
</script>

<template>
  <u-slider v-model="value" />
</template>
```

## 范围选择

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[number, number]>([20, 80])
</script>

<template>
  <u-slider v-model="range" range />
</template>
```

## 设置步长

```vue
<template>
  <u-slider v-model="value" :step="10" />
</template>
```

## 垂直模式

```vue
<template>
  <u-slider v-model="value" vertical />
</template>
```

## 禁用 / 只读

```vue
<template>
  <u-slider v-model="value" disabled />
  <u-slider v-model="value" readonly />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ volume: 30 })
</script>

<template>
  <u-form :model="formData">
    <u-slider field="volume" label="音量" />
  </u-form>
</template>
```

## 点击滑轨调整

```vue
<template>
  <!-- 点击滑轨可直接跳转 -->
  <u-slider v-model="value" />

  <!-- 范围模式只能拖 thumb，点击滑轨不生效 -->
  <u-slider v-model="range" range />
</template>
```
