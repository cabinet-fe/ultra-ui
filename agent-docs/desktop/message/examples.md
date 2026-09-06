---
title: UMessage 消息提示示例
description: 优先用 message 函数式 API；UMessage 也可声明式渲染单条消息
---

日常用从 `@veltra/desktop` 导入的 `message`。可传字符串或选项对象；快捷方法有 `success` / `info` / `warn` / `error` / `default`。`duration` 为 `0` 时不自动关闭。返回实例带 `close()` 与 `onClosed` Promise。

```ts
import { message } from '@veltra/desktop'

message('已保存')
message({ message: '操作成功', type: 'success', duration: 5000 })
message.warn('请检查输入', { closable: true })

const inst = message.info('处理中…', { duration: 0 })
inst.close()
message.closeAll()
```

声明式使用 `UMessage`：

```vue
<template>
  <u-message message="提示内容" type="info" />
  <u-message message="操作成功" type="success" :duration="0" closable />
</template>
```
