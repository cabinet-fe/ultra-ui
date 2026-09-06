---
title: UTip 提示示例
description: 默认插槽为触发器，content 或 content 插槽提供提示内容
---

`UTip` 默认插槽是触发元素，`content` 为提示文案；复杂内容用 `#content`。`trigger` 为 `'hover'`（默认）或 `'click'`。`direction` 为 `'top' | 'bottom' | 'left' | 'right'`，`alignment` 为 `'center' | 'start' | 'end'`。

```vue
<template>
  <u-tip content="保存后不可撤销" direction="top" alignment="center">
    <u-button>悬停查看</u-button>
  </u-tip>
</template>
```

点击触发，并用插槽自定义内容；`showDelay` 仅在 `trigger="hover"` 时生效：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-tip trigger="click" v-model:visible="visible" :show-delay="0">
    <u-button>点击</u-button>
    <template #content>
      <p>自定义提示内容</p>
    </template>
  </u-tip>
</template>
```
