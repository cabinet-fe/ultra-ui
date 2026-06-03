# MessageConfirm — 消息确认

> 类型：`../../../generated/types/message-confirm.ts`

函数式确认对话框，通过遮罩层弹出，常用于删除确认、操作二次确认等场景。

> `import type { MessageConfirmProps, MessageConfirmEmits, MessageConfirmExposed } from '@veltra/desktop'`

## Import

```ts
import { MessageConfirm } from '@veltra/desktop'
// UMessageConfirm 由 Vite 自动导入，无需手动 import
```

- `MessageConfirm` — 函数式 API，直接调用即可弹出
- `UMessageConfirm` — 组件形式，支持声明式使用（如需要 `v-model` 控制）

## API

### 基础调用

```ts
MessageConfirm(options: MessageConfirmProps): void
```

### 快捷方法

```ts
MessageConfirm.primary(message: string, onClose?: (action: 'cancel' | 'confirm') => void): void
MessageConfirm.success(message: string, onClose?: (action: 'cancel' | 'confirm') => void): void
MessageConfirm.info(message: string, onClose?: (action: 'cancel' | 'confirm') => void): void
MessageConfirm.warning(message: string, onClose?: (action: 'cancel' | 'confirm') => void): void
MessageConfirm.danger(message: string, onClose?: (action: 'cancel' | 'confirm') => void): void
```

快捷方法等同于调用 `MessageConfirm({ message, confirmButtonType: type, onClose })`。

## Options

| 参数                | 类型                                      | 默认值      | 说明                                                                              |
| ------------------- | ----------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `message`           | `string`                                  | —           | **必填**，消息内容                                                                |
| `title`             | `string`                                  | `''`        | 标题，为空时不显示标题栏                                                          |
| `confirmButtonText` | `string`                                  | `'确定'`    | 确认按钮文字                                                                      |
| `cancelButtonText`  | `string`                                  | `''`        | 取消按钮文字，为空时不显示取消按钮                                                |
| `confirmButtonType` | `ColorType`                               | `'primary'` | 确认按钮类型：`'primary'` \| `'success'` \| `'info'` \| `'warning'` \| `'danger'` |
| `onClose`           | `(action: 'cancel' \| 'confirm') => void` | —           | 关闭回调，`action` 区分用户点击了哪个按钮                                         |

> 示例见 [examples.md](./examples.md)
