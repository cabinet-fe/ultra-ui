# URadio 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('a')
</script>

<template>
  <u-radio v-model="selected" value="a" label="选项 A" />
  <u-radio v-model="selected" value="b" label="选项 B" />
  <u-radio v-model="selected" value="c">选项 C（slot）</u-radio>
</template>
```

## 禁用

```vue
<u-radio v-model="selected" value="a" label="禁用选项" disabled />
```

## 不同尺寸

```vue
<u-radio v-model="selected" value="a" label="小号" size="small" />
<u-radio v-model="selected" value="b" label="默认" />
<u-radio v-model="selected" value="c" label="大号" size="large" />
```

## 配合 URadioGroup 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'

const gender = ref('')
const options = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <u-radio-group v-model="gender" :items="options" />
</template>
```

## 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'

const formData = reactive({ gender: '' })
</script>

<template>
  <u-form :model="formData" size="small" disabled>
    <u-radio value="male" label="男" field="gender" />
    <u-radio value="female" label="女" field="gender" />
  </u-form>
</template>
```
