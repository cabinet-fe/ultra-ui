# UPopConfirm — 弹出确认

> `import type { PopConfirmProps, PopConfirmEmits } from '@veltra/desktop'`

## Import

```ts
import { UPopConfirm } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `title` | `string` | — | 标题
| `icon` | `Component` | — | 图标组件
| `iconColor` | `string` | — | 图标颜色
| `confirmText` | `string` | — | 确认按钮文字
| `cancelText` | `string` | — | 取消按钮文字

继承 `TipProps`（`alignment`、`direction`、`trigger`、`contentTag`）。

## Emits

| event | 参数
|-------|------
| `confirm` | — 点击确认时触发
| `cancel` | — 点击取消时触发

## Examples

```vue
<u-pop-confirm title="确定删除？" @confirm="handleDelete">
  <u-button>删除</u-button>
</u-pop-confirm>
```
