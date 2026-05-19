# UCalendar — 日历

> `import type { CalendarProps, CalendarEmits, CalendarExposed } from '@veltra/desktop'`

## Import

```ts
// UCalendar 由 Vite 自动导入，无需手动 import
```

## Props

| prop         | type     | default | 说明                                                                                |
| ------------ | -------- | ------- | ----------------------------------------------------------------------------------- |
| `modelValue` | `string` | —       | 当前日期字符串，通过 `v-model` 双向绑定。传递给 `getMonthDays()` 确定展示月份的网格 |

## Emits

| event               | 参数              | 说明               |
| ------------------- | ----------------- | ------------------ |
| `update:modelValue` | `(value: string)` | `v-model` 更新回调 |

## Slots

无插槽。

## Exposed

```ts
interface CalendarExposed {}
```

无暴露属性或方法。

## 相关类型

```ts
interface CalendarDay {
  date: Dater // @cat-kit/core 的 Dater 实例
  isToday?: boolean // 是否今日
  type: 'pre' | 'current' | 'next' // 日期类型：上月 / 本月 / 下月
  disabled?: boolean // 是否禁止选择
}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const date = ref<string>('2026-05-13')
</script>

<template>
  <u-calendar v-model="date" />
</template>
```

### 监听日期变化

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const date = ref<string>(new Date().toISOString().slice(0, 10))

watch(date, (val) => {
  console.log('选中日期已变更:', val)
})
</script>

<template>
  <u-calendar v-model="date" />
</template>
```

### 自定义选中日期样式

日历默认为 `pre` / `next` 月日期应用 `color: var(--text-color-disabled)`。如需覆盖，可基于 CSS变量 重写：

```scss
.u-calendar__day--current {
  &:hover {
    background-color: var(--color-primary-light);
  }
}
```

### 配合其他组件使用

```vue
<script setup lang="ts">
import { ref } from 'vue'

const date = ref<string>()
</script>

<template>
  <div class="demo-calendar">
    <p v-if="date">选中的日期：{{ date }}</p>
    <u-calendar v-model="date" />
  </div>
</template>
```
