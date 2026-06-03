# UProgressNodes 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const activeNode = ref('step-1')
const nodes = [
  { label: '提交', value: 'step-1' },
  { label: '审核', value: 'step-2' },
  { label: '完成', value: 'step-3' }
]

const isChecked = (_node: Record<string, unknown>, index: number) => index < 2
</script>

<template>
  <u-progress-nodes
    v-model="activeNode"
    :nodes="nodes"
    :check="isChecked"
    color-type="primary"
    max-width="520px"
  />
</template>
```
