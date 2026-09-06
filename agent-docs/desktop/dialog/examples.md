---
title: UDialog 对话框示例
description: 用 v-model 或 trigger 插槽打开对话框，footer 插槽可拿到 close
---

`UDialog` 用 `v-model` 控制显隐，也可用 `#trigger` 插槽点击打开。遮罩默认开启（`modal`）。`#footer` 作用域提供 `close`；默认插槽可拿到 `maximized`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-button @click="visible = true">打开</u-button>

  <u-dialog v-model="visible" title="提示" style="width: 480px">
    <p>对话框内容</p>
    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>
```

用 `#trigger` 打开，无需外部 `v-model`：

```vue
<template>
  <u-dialog title="消息" :modal="false" @closed="() => {}">
    <template #trigger>
      <u-button>打开对话框</u-button>
    </template>
    <p>非模态对话框不显示遮罩</p>
  </u-dialog>
</template>
```
