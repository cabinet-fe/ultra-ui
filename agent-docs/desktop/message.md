---
title: "UMessage - 消息提示"
description: "优先用 message 函数式 API；UMessage 也可声明式渲染单条消息"
keywords:
  - UMessage
  - @veltra/desktop
  - message
  - Message
  - 消息提示
aliases: ["message", "UMessage", "Message", "消息提示"]
---

## 快速上手

```ts
import { UMessage } from '@veltra/desktop'
```

## 典型示例

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

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { DefineComponent, AppContext } from 'vue'

/** 消息类型 */
export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

/** 消息选项 */
export type MessageOptions = MessageProps & {
  /** 关闭回调 */
  onClose?: () => void
  /** 关闭结束后回调 */
  onClosed?: () => void
}

type MsgAliasConf = Omit<MessageOptions, 'type' | 'message'>

export interface MessageInstance {
  /** 消息唯一标识 */
  id: string
  /** 手动关闭消息 */
  close(): void
  /** 消息彻底销毁后的 Promise (包括动画结束) */
  onClosed: Promise<void>
}

export interface Message {
  /** 创建消息 */
  (options: MessageOptions | string): MessageInstance
  /** 关闭所有的消息 */
  closeAll(): void
  /** 成功消息 */
  success(message: string, config?: MsgAliasConf): MessageInstance
  /** 警告消息 */
  warn(message: string, config?: MsgAliasConf): MessageInstance
  /** 信息消息 */
  info(message: string, config?: MsgAliasConf): MessageInstance
  /** 错误消息 */
  error(message: string, config?: MsgAliasConf): MessageInstance
  /** 默认消息 */
  default(message: string, config?: MsgAliasConf): MessageInstance
  /** 设置全局渲染上下文 */
  _context: AppContext | null
}

/** 消息弹框组件组件属性 */
export interface MessageProps {
  /** 消息内容 */
  message?: string
  /** 渲染样式 */
  type?: MessageType
  /** 是否可以关闭 */
  closable?: boolean
  /**
   * 持续时间, 单位ms
   * @default 3000
   */
  duration?: number
  /** 渲染html */
  html?: boolean
  /** 图标 */
  icon?: DefineComponent
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### message

函数式全局消息（`success` / `info` / `warn` / `error` 等快捷方法）。

使用示例:

```ts
import { message } from '@veltra/desktop'
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
