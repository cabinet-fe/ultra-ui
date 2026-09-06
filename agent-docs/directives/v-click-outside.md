---
title: "vClickOutside - 点击外部关闭与浮层遮罩点击指令"
description: "Vue 点击元素外部触发回调指令，常用于下拉菜单、弹出框、模态弹窗、抽屉及 Popover 浮层点击外部自动关闭与收起场景；支持绑定回调函数或动态解除监听（传 undefined / false），无修饰符，内部基于 document 捕获阶段 mousedown 与 click 双重校验精准判定"
keywords:
  - vClickOutside
  - @veltra/directives
  - v-click-outside
  - ClickOutside
  - 点击外部关闭与浮层遮罩点击指令
aliases: ["v-click-outside", "vClickOutside", "点击外部关闭与浮层遮罩点击指令"]
---
## 快速上手

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

