---
title: UNotification 通知示例
description: 用 notification 弹出通知条，可指定方位与快捷类型
---

从 `@veltra/desktop` 导入 `notification`。可传字符串或选项（`title` / `message` / `type` / `position` / `duration`）。`position` 为 `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`。快捷方法：`primary` / `success` / `info` / `warning` / `danger`。`closeAll(position?)` 可按方位清空。

```ts
import { notification } from '@veltra/desktop'

notification({
  title: '已创建',
  message: '日程已写入日历',
  type: 'success',
  position: 'bottom-right',
  duration: 4500
})

notification.success('保存成功', { title: '成功', position: 'top-right' })
notification.closeAll('bottom-right')
```

声明式使用 `UNotification`：

```vue
<template>
  <u-notification title="提醒" message="有新的待办" type="info" :duration="0" closable />
</template>
```
