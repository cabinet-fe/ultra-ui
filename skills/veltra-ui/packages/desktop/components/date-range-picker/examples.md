# UDateRangePicker 示例

## 基础用法

```vue
<u-date-range-picker v-model="range" />
```

## 限制可选日期

```vue
<script setup>
const disabledDate = (d) => d.isBefore(new Date())
</script>
<template>
  <u-date-range-picker v-model="range" :disabled-date="disabledDate" />
</template>
```

## 月份范围选择

```vue
<u-date-range-picker v-model="range" type="month" format="yyyy年MM月" />
```

## 只读模式

```vue
<u-date-range-picker v-model="range" readonly />
```
