---
title: vFocus 挂载时聚焦
description: 指令在 mounted 时聚焦元素本身或内部的 input
---

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
