# UEmpty — 空状态

> `import type { EmptyProps } from '@veltra/desktop'`

空内容占位组件，用于无数据、搜索无结果等场景，居中显示图标与提示文案。

## Import

```ts
// UEmpty 由 Vite 自动导入，无需手动 import
```

## Props

| prop   | type     | default      | 说明           |
| ------ | -------- | ------------ | -------------- |
| `size` | `number` | `48`         | 图标尺寸（px） |
| `text` | `string` | `'暂无数据'` | 空状态提示文案 |

## Emits

无事件。

## Slots

无插槽。

## Exposed

```ts
interface EmptyExposed {}
```

## Examples

### 基础用法

```vue
<u-empty />
```

### 自定义文案与大小

```vue
<u-empty text="搜索无结果" :size="64" />
```

### 条件渲染

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

### 搭配其他组件

```vue
<div style="text-align: center">
  <u-empty text="还没有订单" />
  <u-button type="primary" style="margin-top: 12px">去下单</u-button>
</div>
```
