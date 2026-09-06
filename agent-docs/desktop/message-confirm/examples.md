---
title: UMessageConfirm 消息确认示例
description: 用 messageConfirm 弹出确认框，onClosed 得到 confirm 或 cancel
---

从 `@veltra/desktop` 导入 `messageConfirm`。`message` 必填（字符串简写即内容）。快捷方法 `primary` / `success` / `info` / `warning` / `danger` 会设置 `confirmButtonType`。实例的 `onClosed` 解析为 `'confirm' | 'cancel'`。

```ts
import { messageConfirm } from '@veltra/desktop'

const inst = messageConfirm({
  title: '删除',
  message: '确认删除该文件？',
  confirmButtonText: '删除',
  cancelButtonText: '取消',
  confirmButtonType: 'danger'
})

inst.onClosed.then((action) => {
  if (action === 'confirm') console.log('已确认')
})

messageConfirm.danger('此操作不可撤销', { cancelButtonText: '取消' })
```

声明式使用 `UMessageConfirm`：

```vue
<template>
  <u-message-confirm
    title="提示"
    message="是否继续？"
    confirm-button-text="确定"
    cancel-button-text="取消"
    @close="(action) => console.log(action)"
  />
</template>
```
