# useVirtualizer 示例

## 基础虚拟列表

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

const count = ref(1000)
const list = ref(Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Item ${i}` })))
const scrollEl = shallowRef<HTMLElement>()
const contentEl = shallowRef<HTMLElement>()
const beforeEl = shallowRef<HTMLElement>()
const afterEl = shallowRef<HTMLElement>()

const { virtualizer, items, isScrolling } = useVirtualizer({
  count,
  scrollEl,
  contentEl,
  beforeEl,
  afterEl,
  estimateSize: () => 40,
  getItemKey: (i) => list.value[i]!.id
})

// virtualizer.scrollToIndex / scrollToOffset / setOptions / measureElement
</script>

<template>
  <div ref="scrollEl" class="viewport">
    <div ref="contentEl">
      <div ref="beforeEl" />
      <div
        v-for="item in items"
        :key="item.key"
        :ref="virtualizer.measureElement"
        :data-index="item.index"
      >
        {{ list[item.index]?.label }}
      </div>
      <div ref="afterEl" />
    </div>
  </div>
</template>
```
