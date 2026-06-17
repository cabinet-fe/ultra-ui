# UTip 示例

## hover 触发

```vue
<template>
  <UTip content="这是一段提示文本">
    <UButton>悬停查看</UButton>
  </UTip>
</template>
```

## click 触发

```vue
<template>
  <UTip content="点击后显示的提示" trigger="click">
    <UButton>点击查看</UButton>
  </UTip>
</template>
```

## 自定义触发元素

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const customEl = useTemplateRef('customEl')
</script>

<template>
  <UTip content="提示文本" :trigger-dom="customEl">
    <span>这段文本不会作为定位基准</span>
  </UTip>
  <div ref="customEl">实际定位基准元素</div>
</template>
```

## 自定义方向和对齐

```vue
<template>
  <UTip content="提示内容" direction="bottom" alignment="start">
    <UButton>底部对齐</UButton>
  </UTip>
</template>
```

## 隐藏箭头

```vue
<template>
  <UTip content="无箭头的提示" :hide-arrow="true">
    <UButton>无箭头</UButton>
  </UTip>
</template>
```

## 受控显隐

```vue
<template>
  <UTip content="受控提示" :visible="visible" @update:visible="visible = $event">
    <UButton>受控显示</UButton>
  </UTip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const visible = ref(false)
</script>
```

## 禁用状态

```vue
<template>
  <UTip content="这段提示不会显示" disabled>
    <UButton>禁用提示</UButton>
  </UTip>
</template>
```
