# URadioGroup 示例

## 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'

const formData = reactive({ choice: '' })

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
</script>

<template>
  <u-form :model="formData" size="small">
    <u-radio-group label="选择" field="choice" :items="options" />
  </u-form>
</template>
```
