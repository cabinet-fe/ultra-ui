# UCheckboxGroup 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref<(string | number)[]>([])
const items = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '橙子', value: 'orange' }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ hobbies: ['reading'] as string[] })

const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' }
]
</script>

<template>
  <u-form :model="formData">
    <u-checkbox-group label="爱好" field="hobbies" :items="hobbyList" />
  </u-form>
</template>
```
