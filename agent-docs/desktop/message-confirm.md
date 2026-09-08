---
title: "UMessageConfirm - 消息确认"
description: "用 messageConfirm 弹出确认框，onClosed 得到 confirm 或 cancel"
keywords:
  - UMessageConfirm
  - @veltra/desktop
  - message-confirm
  - MessageConfirm
  - 消息确认
aliases: ["message-confirm", "UMessageConfirm", "MessageConfirm", "消息确认"]
---

## 快速上手

```ts
import { UMessageConfirm } from '@veltra/desktop'
```

## 典型示例

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

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { AppContext } from 'vue'

/** 消息确认框用户操作 */
export type MessageConfirmAction = 'confirm' | 'cancel'

/** 消息确认框组件属性 */
export interface MessageConfirmProps extends ComponentProps {
  /** 标题 */
  title?: string
  /** 内容 */
  message: string
  /** 确认按钮文字 */
  confirmButtonText?: string
  /** 取消按钮文字，为空则不显示 */
  cancelButtonText?: string
  /** 确认按钮类型 */
  confirmButtonType?: ColorType
  /** 层级，默认由 API 创建时自增分配 */
  zIndex?: number
}

/** 消息确认框调用选项 */
export interface MessageConfirmOptions extends MessageConfirmProps {
  /** 点击按钮触发关闭时回调 */
  onClose?: (action: MessageConfirmAction) => void
  /** 关闭动画结束后回调 */
  onClosed?: (action: MessageConfirmAction) => void
}

/** 消息确认框实例 */
export interface MessageConfirmInstance {
  /** 唯一标识 */
  id: string
  /** 手动关闭，未指定操作时视为 cancel */
  close(action?: MessageConfirmAction): void
  /** 彻底关闭（含动画结束）后的 Promise，值为用户操作 */
  onClosed: Promise<MessageConfirmAction>
}

type MessageConfirmShortcutConfig = Omit<MessageConfirmOptions, 'message' | 'confirmButtonType'>

/** 消息确认框函数式 API */
export interface MessageConfirm {
  /** 创建确认框 */
  (options: MessageConfirmOptions | string): MessageConfirmInstance
  /** 主要确认框 */
  primary(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 成功确认框 */
  success(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 信息确认框 */
  info(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 警告确认框 */
  warning(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 危险确认框 */
  danger(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 关闭所有确认框 */
  closeAll(): void
  /** 设置全局渲染上下文 */
  _context: AppContext | null
}

/** 消息确认框组件定义的事件 */
export interface MessageConfirmEmits {
  (e: 'close', action: MessageConfirmAction): void
}

/** 消息确认框组件暴露的属性和方法(组件内部使用) */
export interface _MessageConfirmExposed {}

/** 消息确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageConfirmExposed = DeconstructValue<_MessageConfirmExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### messageConfirm

函数式确认框；另有 `primary` / `success` / `info` / `warning` / `danger` 快捷方法与 `closeAll()`。

使用示例:

```ts
import { messageConfirm } from '@veltra/desktop'
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
