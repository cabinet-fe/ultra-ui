# UMessageConfirm — 消息确认框

> `import type { MessageConfirmProps, MessageConfirmEmits } from '@veltra/desktop'`

## Import

```ts
import { UMessageConfirm, MessageConfirm } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 打开状态
| `title` | `string` | — | 标题
| `message` | `string` | — | 消息内容
| `confirmButtonText` | `string` | — | 确认按钮文字
| `cancelButtonText` | `string` | — | 取消按钮文字
| `confirmButtonType` | `ColorType` | — | 确认按钮类型
| `onClose` | `(action: 'cancel' \| 'confirm') => void` | — | 关闭回调

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 状态变化

## Programming API

```ts
// 基础调用
MessageConfirm(options)
// 快捷方法
MessageConfirm.primary(options)
MessageConfirm.success(options)
MessageConfirm.info(options)
MessageConfirm.warning(options)
MessageConfirm.danger(options)
```

## Examples

```vue
<u-message-confirm message="确认删除？" />
```
