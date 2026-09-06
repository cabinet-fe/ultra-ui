---
title: URadio 示例
description: 单个单选框用 value 匹配 model；表单场景请用 URadioGroup 加 field
---

多个 `URadio` 绑定同一个 `v-model`，用 `value` 区分选项。文案可用 `label` 或默认插槽。独立使用不要写 `field`。表单里请用 `URadioGroup` + `field`，不要给多个 `URadio` 写同一个 `field`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-radio
    v-for="item of items"
    :key="item.value"
    v-model="selected"
    :value="item.value"
    :disabled="item.value === '3'"
  >
    {{ item.label }}
  </u-radio>
</template>
```
