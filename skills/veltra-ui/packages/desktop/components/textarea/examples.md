# UTextarea 示例

## 基础用法

```vue
<script setup>
import { shallowRef } from 'vue'
const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" placeholder="请输入内容" />
</template>
```

## 字数统计与限制

```vue
<script setup>
import { shallowRef } from 'vue'
const remark = shallowRef('')
</script>

<template>
  <u-textarea v-model="remark" placeholder="请输入备注" :maxlength="200" show-count />
</template>
```

## 自适应高度

```vue
<script setup>
import { shallowRef } from 'vue'
const content = shallowRef('')
</script>

<template>
  <u-textarea v-model="content" placeholder="输入内容，高度会自动扩展" autosize />
</template>
```

## 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'
const form = reactive({ description: '' })
</script>

<template>
  <u-form :model="form">
    <u-textarea
      label="描述"
      field="description"
      placeholder="请输入描述信息"
      :maxlength="500"
      show-count
    />
  </u-form>
</template>
```
