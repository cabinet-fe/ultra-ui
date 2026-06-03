# UEmpty 示例

## 基础用法

```vue
<u-empty />
```

## 自定义文案与大小

```vue
<u-empty text="搜索无结果" :size="64" />
```

## 条件渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

const list = ref<string[]>([])
</script>

<template>
  <div v-if="list.length">
    <!-- 列表内容 -->
  </div>
  <u-empty v-else text="暂无列表数据" />
</template>
```

## 搭配其他组件

```vue
<div style="text-align: center">
  <u-empty text="还没有订单" />
  <u-button type="primary" style="margin-top: 12px">去下单</u-button>
</div>
```
