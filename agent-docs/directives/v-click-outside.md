---
title: vClickOutside 点击外部
description: 在 document 上协调 mousedown 与 click，点击元素外部时调用回调
---

`vClickOutside` 在捕获阶段监听 `document` 的 `mousedown` 与 `click`。两次事件的 `target` 必须相同才视为一次完整点击，然后对不包含该 target 的已注册元素调用回调。没有绑定值时不注册。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const open = ref(true)

function handleClickOutside() {
  open.value = false
}
</script>

<template>
  <div v-if="open" v-click-outside="handleClickOutside">面板</div>
</template>
```

绑定值可在更新时换成新函数，或设为假值以解除监听。`app.use(UltraUI)` 会注册为 `v-click-outside`。需要按触发方式开关时，可传 `undefined` 表示当前不监听：

```vue
<div v-click-outside="trigger === 'click' ? handleClickOutside : undefined">
  内容
</div>
```
