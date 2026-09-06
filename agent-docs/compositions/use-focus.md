---
title: useFocus 焦点状态
description: 维护 focus 布尔值，并把 handleFocus / handleBlur 绑到 DOM 事件
---

`useFocus` 返回一个 `Ref<boolean>` 以及一对事件处理函数。可选回调在焦点变化时收到当前值。

```vue
<script setup lang="ts">
import { useFocus } from '@veltra/compositions'

const { focus, handleFocus, handleBlur } = useFocus((focused) => {
  console.log(focused)
})
</script>

<template>
  <input :class="{ 'is-focus': focus }" @focus="handleFocus" @blur="handleBlur" />
</template>
```

`handleFocus` 把 `focus` 设为 `true`，`handleBlur` 设为 `false`。它不操作 DOM 焦点，只同步状态；真正聚焦元素请用原生 `focus()` 或 `vFocus`。
