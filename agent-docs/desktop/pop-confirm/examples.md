---
title: UPopConfirm 气泡确认示例
description: 用 reference 插槽作为触发器，监听 confirm 与 cancel
---

`UPopConfirm` 基于 `UTip`。触发器用 `#reference`，文案走 `title`。确认 / 取消分别触发 `confirm` / `cancel`。可改 `confirmText`、`cancelText`，以及 `direction` / `alignment` / `trigger`。

```vue
<script setup lang="ts">
function onConfirm() {
  console.log('已确认')
}
</script>

<template>
  <u-pop-confirm title="确认删除这条记录？" confirm-text="删除" cancel-text="取消" @confirm="onConfirm">
    <template #reference>
      <u-button type="danger">删除</u-button>
    </template>
  </u-pop-confirm>
</template>
```
