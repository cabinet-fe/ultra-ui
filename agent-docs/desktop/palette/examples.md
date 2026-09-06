---
title: UPalette 调色盘示例
description: 用 UPalette 选择颜色，绑定值为 HEX 字符串
---

`UPalette` 的 `modelValue` 是颜色字符串。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#1E88E5')
</script>

<template>
  <u-palette v-model="color" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ brand: '#1E88E5' })
</script>

<template>
  <u-form :model="form">
    <u-palette label="品牌色" field="brand" size="small" />
  </u-form>
</template>
```
