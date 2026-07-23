# useReactiveSize 示例

## 单个元素

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { useReactiveSize } from '@veltra/compositions'

const elRef = shallowRef<HTMLElement>()
const size = useReactiveSize(elRef)
// 模板直接 size.width / size.height（非 ref）
</script>

<template>
  <div ref="elRef">{{ size.width }} × {{ size.height }}</div>
</template>
```

## 多个元素

```ts
import { shallowRef } from 'vue'
import { useReactiveSize } from '@veltra/compositions'

const el1 = shallowRef<HTMLElement>()
const el2 = shallowRef<HTMLElement>()
const sizes = useReactiveSize([el1, el2])
// sizes[0].width / sizes[1].height
```
