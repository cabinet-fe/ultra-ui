# UDatePicker 示例

## 基础日期选择

```vue
<script setup>
import { shallowRef } from 'vue'
const date = shallowRef('')
const month = shallowRef('')
const year = shallowRef('')
</script>

<template>
  <u-date-picker v-model="date" type="date" />
  <u-date-picker v-model="month" type="month" />
  <u-date-picker v-model="year" type="year" />
</template>
```

## 禁用日期

```vue
<script setup>
import { date, type Dater } from '@cat-kit/core'
import { shallowRef } from 'vue'

const d = shallowRef('')

function disabledDate(d: Dater) {
  return d.timestamp <= Date.now()
}
</script>

<template>
  <u-date-picker v-model="d" :disabled-date="disabledDate" />
  <p>选中: {{ d }}</p>
</template>
```

## modelValue 传入 Date / number

```vue
<script setup>
import { ref } from 'vue'

const dateRef = ref(new Date())
const timestampRef = ref(Date.now())
</script>

<template>
  <u-date-picker v-model="dateRef" />
  <u-date-picker v-model="timestampRef" />
</template>
```

## 自定义格式

```vue
<template>
  <u-date-picker v-model="date" format="yyyy年MM月dd日" />
  <u-date-picker v-model="month" type="month" format="yyyy/MM" />
</template>
```

## 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'

const formData = reactive({ birthday: '', joinDate: '' })
</script>

<template>
  <u-form :model="formData">
    <u-date-picker label="生日" field="birthday" />
    <u-date-picker label="入职日期" field="joinDate" />
  </u-form>
</template>
```
