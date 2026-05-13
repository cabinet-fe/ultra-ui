# UPopConfirm — 气泡确认框

> `import type { PopConfirmProps, PopConfirmEmits, PopConfirmExposed } from '@veltra/desktop'`

基于 `UTip` 的二次确认浮层，用于防止用户误操作。点击触发按钮后弹出确认框，用户确认或取消后自动关闭。

## Import

```ts
import { UPopConfirm } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `title` | `string` | — | 确认提示文字 |
| `icon` | `Component` | `QuestionFilled` | 图标组件 |
| `iconColor` | `string` | `'#ffc107'` | 图标颜色 |
| `confirmText` | `string` | `'确认'` | 确认按钮文字 |
| `cancelText` | `string` | `'取消'` | 取消按钮文字 |
| `trigger` | `'hover' \| 'click'` | `'click'` | 触发方式 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | 弹出方向 |
| `alignment` | `'center' \| 'start' \| 'end'` | `'center'` | 对齐方式 |
| `contentTag` | `string` | — | 浮层内容容器标签名 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `confirm` | — | 点击确认按钮时触发，触发后浮层自动关闭 |
| `cancel` | — | 点击取消按钮时触发，触发后浮层自动关闭 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `reference` | — | 触发元素，用于唤起确认浮层 |

## Exposed

```ts
interface PopConfirmExposed {
  // 无暴露方法/属性
}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
const handleDelete = () => {
  console.log('已确认删除')
}
</script>

<template>
  <UPopConfirm title="确定要删除吗？" @confirm="handleDelete">
    <template #reference>
      <UButton type="danger">删除</UButton>
    </template>
  </UPopConfirm>
</template>
```

### 自定义文字与方向

```vue
<UPopConfirm
  title="提交后不可撤回，确认提交？"
  confirm-text="提交"
  cancel-text="再想想"
  direction="top"
  @confirm="handleSubmit"
  @cancel="handleCancel"
>
  <template #reference>
    <UButton type="primary">提交</UButton>
  </template>
</UPopConfirm>
```

### 自定义图标

```vue
<script setup lang="ts">
import { WarningFilled } from '@veltra/icons/normal'
</script>

<template>
  <UPopConfirm
    title="此操作不可逆"
    :icon="WarningFilled"
    icon-color="#e84235"
    @confirm="handleConfirm"
  >
    <template #reference>
      <UButton type="danger" plain>危险操作</UButton>
    </template>
  </UPopConfirm>
</template>
```

### hover 触发

```vue
<UPopConfirm
  title="在表格中删除该项？"
  trigger="hover"
  alignment="start"
  @confirm="handleDelete"
>
  <template #reference>
    <UButton text type="danger" :icon="Delete">删除</UButton>
  </template>
</UPopConfirm>
```
