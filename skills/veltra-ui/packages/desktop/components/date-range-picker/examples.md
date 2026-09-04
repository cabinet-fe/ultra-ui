# UDateRangePicker 示例

## 基础用法

```vue
<script setup>
import { shallowRef } from 'vue'

const range = shallowRef()
</script>

<template>
  <u-date-range-picker v-model="range" />
</template>
```

## 限制可选日期

```vue
<script setup>
import { shallowRef } from 'vue'

const range = shallowRef()
const disabledDate = (d) => d.timestamp < Date.now()
</script>

<template>
  <u-date-range-picker v-model="range" :disabled-date="disabledDate" />
</template>
```

## 月份范围选择

```vue
<script setup>
import { shallowRef } from 'vue'

const range = shallowRef()
</script>

<template>
  <u-date-range-picker v-model="range" type="month" format="yyyy年MM月" />
</template>
```

## 只读模式

```vue
<script setup>
import { shallowRef } from 'vue'

const range = shallowRef()
</script>

<template>
  <u-date-range-picker v-model="range" readonly />
</template>
```

## 指定 dataType 与 change 事件

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const dateRange = shallowRef<[Date, Date]>()
const timestampRange = shallowRef<[number, number]>()

function handleChange(dates?: [Date, Date]) {
  console.log('选中的原生 Date 范围:', dates)
}
</script>

<template>
  <u-date-range-picker v-model="dateRange" data-type="date" @change="handleChange" />
  <u-date-range-picker v-model="timestampRange" data-type="timestamp" @change="handleChange" />
</template>
```
