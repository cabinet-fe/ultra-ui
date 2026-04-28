# UNotification — 通知

> `import type { NotificationProps, NotificationEmits } from '@veltra/desktop'`

## Import

```ts
import { UNotification, Notification } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 打开状态
| `title` | `string` | — | 标题
| `message` | `string` | — | 消息内容
| `type` | `ColorType` | — | 类型
| `closable` | `boolean` | — | 是否可关闭
| `duration` | `number` | — | 自动关闭时长
| `offset` | `number` | — | 偏移量
| `onClose` | `Function` | — | 关闭回调
| `onClick` | `Function` | — | 点击回调
| `id` | `string` | — | 唯一标识
| `icon` | `Component` | — | 自定义图标
| `zIndex` | `number` | — | 层级
| `buttonText` | `string` | — | 按钮文字
| `width` | `number` | — | 宽度
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | — | 位置

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 状态变化

## Programming API

```ts
Notification(options)
```

## Examples

```vue
<u-notification title="提示" message="操作成功" />
```
