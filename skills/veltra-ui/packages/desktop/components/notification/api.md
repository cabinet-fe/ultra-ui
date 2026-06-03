# UNotification — 通知

> `import type { NotificationProps, NotificationExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/notification.ts`

悬浮在屏幕角落的全局通知。同位置多次调用自动垂直堆叠，鼠标悬停暂停计时并展开，移出恢复。`Notification()` 是函数式 API；`UNotification` 用于声明式占位渲染。

## Import

```ts
// UNotification 由 Vite 自动导入，无需手动 import
import { Notification } from '@veltra/desktop'
```

## Notification 函数式 API

```ts
import { Notification } from '@veltra/desktop'

Notification({ title: '提示', message: '内容', type: 'success' })
Notification({
  title: '删除确认',
  message: '确定删除？',
  type: 'danger',
  duration: 0,
  closable: true,
  buttonText: '撤销',
  position: 'top-right',
  onClick: () => {},
  onClose: () => {}
})
```

```ts
Notification(options: NotificationProps): void
```

## 回调（通过 Props 传入，非 Emits）

| 回调      | 签名                            | 说明                       |
| --------- | ------------------------------- | -------------------------- |
| `onClick` | `(e: MouseEvent) => void`       | 点击按钮触发，自动关闭通知 |
| `onClose` | `(vm: RendererElement) => void` | 关闭（before-leave）触发   |

> 示例见 [examples.md](./examples.md)
