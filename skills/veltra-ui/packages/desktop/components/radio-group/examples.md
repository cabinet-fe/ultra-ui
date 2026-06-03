# URadioGroup 示例

## 在 UForm 中使用

```vue
<script setup>
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ choice: formField({ value: '' }) })

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
</script>

<template>
  <u-form :model="model" size="small">
    <u-radio-group label="选择" field="choice" :items="options" />
  </u-form>
</template>
```
