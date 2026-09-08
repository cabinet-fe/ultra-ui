---
title: 'useFocus - 元素与表单控件焦点状态管理'
description: 'Vue 焦点状态管理组合式函数，维护元素聚焦布尔状态 ref 并提供 handleFocus / handleBlur 事件处理器，支持状态变化回调函数，适用于自定义输入控件、聚焦外边框发光高亮、搜索框激活与失焦验证场景'
keywords: ['useFocus', '@veltra/compositions', 'use-focus', '元素与表单控件焦点状态管理']
aliases: ['use-focus', 'useFocus', '元素与表单控件焦点状态管理']
---

## 快速上手

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
