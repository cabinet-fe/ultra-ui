---
title: "vFocus - 元素与输入框自动聚焦指令"
description: "Vue 元素挂载时自动聚焦（autofocus）指令，适用于表单输入框、弹窗打开后首个输入控件、搜索框与激活编辑态时自动获取焦点；直接作用于 input 元素或自动查找首个子 input，无修饰符与绑定参数，组件库全局注册为 v-focus"
keywords:
  - vFocus
  - @veltra/directives
  - v-focus
  - Focus
  - 元素与输入框自动聚焦指令
aliases: ["v-focus", "vFocus", "元素与输入框自动聚焦指令"]
---
## 快速上手

`vFocus` 在指令挂载时把焦点放到目标上：元素是 `INPUT` 则直接 `focus()`，否则查找第一个 `input`。找不到 input 时会 `console.warn('v-focus 指令需要一个 input 元素')`。

```vue
<script setup lang="ts">
import { vFocus } from '@veltra/directives'
</script>

<template>
  <input v-focus />
  <label v-focus>
    名称
    <input />
  </label>
</template>
```

通过 `app.use(UltraUI)` 全局注册后，模板里写 `v-focus`，不必再局部导入。局部使用时导入名为 `vFocus`。该指令没有绑定值。

