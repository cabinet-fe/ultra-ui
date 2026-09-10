---
title: messageConfirm / UMessageConfirm 确认框
description: 从 @veltra/desktop 导入 messageConfirm 函数式确认框，带遮罩阻断页面操作，onClosed 以 Promise 返回 confirm / cancel 用户操作；支持 primary/success/info/warning/danger 快捷方法、closeAll 与自定义按钮文字；也可用 UMessageConfirm 声明式渲染。
aliases: [UMessageConfirm, MessageConfirm, 确认弹窗, 确认对话框, MessageBox]
keywords: [MessageConfirmAction, MessageConfirmOptions, MessageConfirmInstance, confirmButtonText, cancelButtonText, confirmButtonType, closeAll, onClosed, onClose, 删除确认, 危险操作确认, 二次确认, 手动关闭, 阻断, 遮罩]
---

# messageConfirm / UMessageConfirm 确认框

`@veltra/desktop` 导出函数式 API `messageConfirm` 与组件 `UMessageConfirm`。`messageConfirm()` 弹出带遮罩的阻断式文字确认框，用户点击确认 / 取消按钮后关闭；返回实例的 `onClosed` 以 `Promise<MessageConfirmAction>` 兑现 `'confirm' | 'cancel'`，可直接 `await` 拿结果。提供 `primary` / `success` / `info` / `warning` / `danger` 快捷方法与 `closeAll()`。

## 快速上手

```ts
import { messageConfirm } from '@veltra/desktop'

// 字符串简写，等价于 messageConfirm({ message: '确认提交吗？' })
const instance = messageConfirm({
  title: '提交确认',
  message: '确认提交本次修改吗？',
  cancelButtonText: '取消', // 不传则不显示取消按钮
})

// 等用户点按钮，含关闭动画在内彻底关闭后兑现
const action = await instance.onClosed
console.log(action) // => 'confirm' 或 'cancel'
```

调用时机：`messageConfirm` 直接在 `document.body` 上创建容器并渲染，不依赖 Vue 应用挂载，导入后即可在任意事件回调、路由守卫中调用；仅要求浏览器环境（SSR 下只能在客户端生命周期中调用）。

## API 签名

```ts
import type { AppContext } from 'vue'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 按钮颜色类型 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 确认框用户操作 */
export type MessageConfirmAction = 'confirm' | 'cancel'

/** 确认框属性 */
export interface MessageConfirmProps {
  /** 标题，为空则不显示标题栏。默认 '' */
  title?: string
  /** 内容，必填 */
  message: string
  /** 确认按钮文字。默认 '确定' */
  confirmButtonText?: string
  /** 取消按钮文字，为空则不显示取消按钮。默认 '' */
  cancelButtonText?: string
  /** 确认按钮颜色类型。默认 'primary' */
  confirmButtonType?: ColorType
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** 层级；不传时由 API 按全局自增计数分配 */
  zIndex?: number
}

/** 函数式调用选项 */
export interface MessageConfirmOptions extends MessageConfirmProps {
  /** 点击按钮触发关闭时回调，参数为用户操作 */
  onClose?: (action: MessageConfirmAction) => void
  /** 关闭动画结束后回调，参数为用户操作 */
  onClosed?: (action: MessageConfirmAction) => void
}

/** 快捷方法第二参数类型：不含 message 与 confirmButtonType */
type MessageConfirmShortcutConfig = Omit<MessageConfirmOptions, 'message' | 'confirmButtonType'>

/** 确认框实例 */
export interface MessageConfirmInstance {
  /** 唯一标识，形如 confirm_0、confirm_1 */
  id: string
  /** 手动关闭；不传 action 时视为 'cancel' */
  close(action?: MessageConfirmAction): void
  /** 彻底关闭（含动画结束）后兑现的 Promise，值为用户操作 */
  onClosed: Promise<MessageConfirmAction>
}

/** 函数式确认框 API */
export interface MessageConfirm {
  (options: MessageConfirmOptions | string): MessageConfirmInstance
  primary(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  success(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  info(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  warning(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  danger(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  /** 关闭所有确认框 */
  closeAll(): void
  /** 全局渲染上下文，默认 null */
  _context: AppContext | null
}

export const messageConfirm: MessageConfirm
```

## 参数说明

`messageConfirm(options)` 选项（快捷方法第二参数 `config` 相同，但不含 `message` / `confirmButtonType`）：

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `message` | `string` | `''` | 是 | 纯文本渲染，不支持 HTML |
| `title` | `string` | `''` | 否 | 为空时不渲染标题栏 |
| `confirmButtonText` | `string` | `'确定'` | 否 | 确认按钮固定显示 |
| `cancelButtonText` | `string` | `''` | 否 | 为空时取消按钮不渲染 |
| `confirmButtonType` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 否 | 快捷方法固定该值，`config` 中不可再传 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | — |
| `zIndex` | `number` | 全局自增（1000 起） | 否 | 容器、遮罩、内容框三层同值 |
| `onClose` | `(action: MessageConfirmAction) => void` | — | 否 | 点击按钮触发关闭时回调 |
| `onClosed` | `(action: MessageConfirmAction) => void` | — | 否 | 关闭动画结束后回调；`closeAll()` 关闭时 action 为 `'cancel'` |

`UMessageConfirm` 组件（声明式）接收 `MessageConfirmProps`，事件见「方法与事件」。

## 方法与事件

实例与快捷方法行为：

- `messageConfirm(...)` 同步返回 `MessageConfirmInstance`，不抛错。
- `instance.close(action?)`：同步，立即触发关闭动画；缺省 `action` 按 `'cancel'` 处理，`onClosed` 以该值兑现。
- `instance.onClosed: Promise<MessageConfirmAction>`：含关闭动画在内彻底关闭后兑现 `'confirm'` 或 `'cancel'`，从不 reject。
- `messageConfirm.closeAll()`：同步清空所有确认框；未记录用户操作的实例（含 `closeAll` 关闭的）`onClosed` 一律兑现 `'cancel'`。
- 遮罩不可点击关闭：只能点确认 / 取消按钮，或用 `instance.close()` / `closeAll()`。
- 层级：`zIndex()` 全局自增计数器从 1000 起，与库内其他弹层共用，保证后弹出的在上层；显式传入 `zIndex` 时优先。

`UMessageConfirm` 组件事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `close` | `action: MessageConfirmAction` | 点击确认或取消按钮 |

## 典型示例

### await onClosed 做删除确认

```ts
import { messageConfirm } from '@veltra/desktop'

async function removeItem(id: string) {
  const action = await messageConfirm({
    title: '删除确认',
    message: '删除后数据无法恢复，确定继续吗？',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    confirmButtonType: 'danger',
  }).onClosed

  if (action === 'confirm') {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    console.log('已删除') // => 用户点击确认后输出
  }
}
```

### danger 快捷方法 + onClose 回调

```ts
import { messageConfirm } from '@veltra/desktop'

// 快捷方法固定 confirmButtonType: 'danger'；第二参数不含 confirmButtonType
messageConfirm.danger('此操作不可逆，确认继续？', {
  title: '危险操作',
  cancelButtonText: '取消',
  onClose: (action) => {
    // 点击按钮、动画开始前触发
    if (action === 'confirm') console.log('用户确认')
  },
})
```

### closeAll 清空与手动关闭

```ts
import { messageConfirm } from '@veltra/desktop'

const instance = messageConfirm({ message: '处理中，是否中断？', cancelButtonText: '取消' })

// 以 'confirm' 语义手动关闭；不传 action 则视为 'cancel'
instance.close('confirm')

// 一键关闭当前全部确认框，onClosed 一律兑现 'cancel'
messageConfirm.closeAll()
```

声明式用法（`UMessageConfirm` 自行控制 `v-if`）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMessageConfirm, type MessageConfirmAction } from '@veltra/desktop'

const visible = ref(false)

function handleClose(action: MessageConfirmAction) {
  visible.value = false // 必须自行移除节点
  if (action === 'confirm') console.log('已确认')
}
</script>

<template>
  <button @click="visible = true">打开确认框</button>
  <UMessageConfirm
    v-if="visible"
    title="提示"
    message="确认要继续操作吗？"
    cancel-button-text="取消"
    @close="handleClose"
  />
</template>
```

## 注意事项

> [!WARNING]
> - 需要轻量、非阻断的行内确认（附着在触发元素旁的气泡）时用 `UPopConfirm`；需要遮罩阻断页面操作的文字确认时用 `messageConfirm`。
> - 需要自定义复杂内容、表单或插槽的对话框时用 `UDialog`；`messageConfirm` 仅支持 `title` + `message` 纯文字，`message` 不支持 HTML。
> - 快捷方法是 `warning` / `danger`，与 `message` 的 `warn` / `error` 拼写不同。
> - 点击遮罩不会关闭确认框，这是设计行为；只能点按钮或调用 `instance.close()` / `closeAll()`。
> - `instance.onClosed` 是 Promise 属性，不是方法；写成 `instance.onClosed()` 会抛 `TypeError`。
> - 需要主题 token：入口必须调用 `@veltra/styles/theme` 的 `loadTheme()`，否则确认框无颜色。
