# UCalendar 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const date = ref<string>('2026-05-13')
</script>

<template>
  <u-calendar v-model="date" />
</template>
```

## 监听日期变化

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

## 自定义选中日期样式

```scss
.u-calendar__day--current {
  &:hover {
    background-color: var(--color-primary-light);
  }
}
```

## 配合其他组件使用

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
