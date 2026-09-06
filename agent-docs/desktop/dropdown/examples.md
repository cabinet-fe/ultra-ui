---
title: UDropdown 下拉菜单示例
description: 用 trigger 与 content 插槽组成下拉，可通过 ref 调用 open / close
---

`UDropdown` 默认 `trigger` 为 `'hover'`，也可设 `'click'` 或 `'custom'`。触发器用 `#trigger`，弹出内容用 `#content`。宽度默认跟随触发器，可用 `width` / `minWidth` 覆盖。

```vue
<template>
  <u-dropdown trigger="click" width="200px">
    <template #trigger>
      <u-button>操作</u-button>
    </template>
    <template #content>
      <ul>
        <li>编辑</li>
        <li>复制</li>
        <li>删除</li>
      </ul>
    </template>
  </u-dropdown>
</template>
```

`trigger="custom"` 时用暴露的 `open` / `close` 指定触发元素：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { DropdownExposed } from '@veltra/desktop'

const dropdownRef = shallowRef<DropdownExposed>()
const spanRef = shallowRef<HTMLSpanElement>()
</script>

<template>
  <u-button @click="dropdownRef?.open({ trigger: spanRef })">在目标处打开</u-button>
  <span ref="spanRef">锚点</span>
  <u-dropdown ref="dropdownRef" trigger="custom" width="160px">
    <template #content>
      <div>自定义触发的菜单</div>
    </template>
  </u-dropdown>
</template>
```
