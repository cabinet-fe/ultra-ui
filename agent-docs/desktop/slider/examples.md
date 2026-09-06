---
title: USlider 滑块示例
description: 用 USlider 选择数值或数值范围，表单内用 field 绑定
---

`USlider` 默认区间 0–100。`range` 为真时绑定值是 `[number, number]`。`step` 会显示刻度。`vertical` 为垂直滑块，通常需要给容器高度。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const volume = ref(40)
const span = ref<[number, number]>([20, 80])
</script>

<template>
  <u-slider v-model="volume" :min="0" :max="100" :step="10" />
  <u-slider v-model="span" range />
  <u-slider v-model="volume" vertical style="height: 200px" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ opacity: 80 })
</script>

<template>
  <u-form :model="form">
    <u-slider label="不透明度" field="opacity" :min="0" :max="100" />
  </u-form>
</template>
```
