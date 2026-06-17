# UScroll 示例

## 基础滚动

```vue
<template>
  <u-scroll height="300px">
    <p v-for="i in 100" :key="i">第 {{ i }} 行</p>
  </u-scroll>
</template>
```

## 始终显示滚动条

```vue
<template>
  <u-scroll height="200px" always>
    <div v-for="i in 50" :key="i" style="padding: 8px">条目 {{ i }}</div>
  </u-scroll>
</template>
```

## 控制滚动位置与监听事件

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ScrollPosition } from '@veltra/desktop'

const scrollRef = useTemplateRef('scroll')

function scrollToBottom() {
  scrollRef.value?.scrollTo({ y: 9999 })
}

function scrollToTop() {
  scrollRef.value?.scrollTo({ y: 0 })
}

function handleScroll(pos: Required<ScrollPosition>) {
  console.log(`x: ${pos.x}, y: ${pos.y}`)
}

function handleResize(targets: HTMLElement[]) {
  console.log('尺寸变化', targets.length)
}
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 8px">
    <u-button size="small" @click="scrollToTop">滚到顶部</u-button>
    <u-button size="small" @click="scrollToBottom">滚到底部</u-button>
  </div>

  <u-scroll ref="scroll" height="300px" @scroll="handleScroll" @resize="handleResize">
    <p v-for="i in 100" :key="i">第 {{ i }} 行</p>
  </u-scroll>
</template>
```

## 自定义样式与标签

```vue
<template>
  <u-scroll
    height="250px"
    tag="ul"
    container-class="custom-container"
    content-class="custom-content"
    :content-style="{ padding: '12px' }"
    :container-style="{ border: '1px solid #e0e0e0', borderRadius: '6px' }"
  >
    <li v-for="i in 20" :key="i" style="padding: 8px; border-bottom: 1px solid #eee">
      列表项 {{ i }}
    </li>
  </u-scroll>
</template>
```
