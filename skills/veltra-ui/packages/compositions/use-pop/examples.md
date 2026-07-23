# usePop 示例

## 基础定位

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()

const { update } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  alignment: 'center',
  onTriggerPositionChange: () => {
    void update()
  },
  onBeforeUpdate: (trigger, content) => {
    content.style.minWidth = `${trigger.offsetWidth}px`
  }
})
</script>

<template>
  <button ref="triggerRef">打开</button>
  <div ref="contentRef" class="pop">内容</div>
</template>
```

## 带箭头

```ts
import { shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const { update, popperContainerId } = usePop({
  triggerRef,
  contentRef,
  arrowRef,
  arrowSize: 10,
  direction: 'top',
  onTriggerPositionChange: () => {
    void update()
  }
})
// 浮层挂载目标：document.getElementById(popperContainerId)
```
