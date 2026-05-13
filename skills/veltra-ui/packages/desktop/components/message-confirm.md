# MessageConfirm — 消息确认

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

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | — | **必填**，消息内容 |
| `title` | `string` | `''` | 标题，为空时不显示标题栏 |
| `confirmButtonText` | `string` | `'确定'` | 确认按钮文字 |
| `cancelButtonText` | `string` | `''` | 取消按钮文字，为空时不显示取消按钮 |
| `confirmButtonType` | `ColorType` | `'primary'` | 确认按钮类型：`'primary'` \| `'success'` \| `'info'` \| `'warning'` \| `'danger'` |
| `onClose` | `(action: 'cancel' \| 'confirm') => void` | — | 关闭回调，`action` 区分用户点击了哪个按钮 |

### MessageConfirmProps

```ts
interface MessageConfirmProps extends ComponentProps {
  modelValue?: string
  title?: string
  message: string
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonType?: ColorType
  onClose?: (action: 'cancel' | 'confirm') => void
}
```

## Emits

仅 `UMessageConfirm` 组件支持。

| event | 参数 |
|-------|------|
| `update:modelValue` | `(value: string)` |
| `destroy` | — 过渡动画结束后触发，函数式调用中用于销毁 DOM |

## Examples

### 基础确认（仅确认按钮）

```ts
import { MessageConfirm } from '@veltra/desktop'

MessageConfirm({ message: '操作成功' })
```

### 带取消按钮

```ts
MessageConfirm({
  message: '确定要删除该项吗？',
  cancelButtonText: '取消'
})
```

### 带回调

```ts
MessageConfirm({
  title: '删除确认',
  message: '删除后数据无法恢复，确定要继续吗？',
  confirmButtonText: '确认删除',
  cancelButtonText: '取消',
  onClose: (action) => {
    if (action === 'confirm') {
      // 执行删除逻辑
      api.deleteItem(id)
    }
  }
})
```

### 快捷方法

```ts
// 危险操作确认
MessageConfirm.danger('此操作不可逆，确认继续？', (action) => {
  if (action === 'confirm') {
    // ...
  }
})

// 成功提示确认
MessageConfirm.success('数据已保存，确认关闭？')

// 警告确认
MessageConfirm.warning('配置尚未保存，确认离开？', (action) => {
  if (action === 'confirm') {
    router.push('/list')
  }
})
```

### 封装为 Promise

```ts
function confirm(message: string, options?: Partial<MessageConfirmProps>): Promise<boolean> {
  return new Promise((resolve) => {
    MessageConfirm({
      message,
      cancelButtonText: '取消',
      ...options,
      onClose: (action) => {
        resolve(action === 'confirm')
        options?.onClose?.(action)
      }
    })
  })
}

// 使用
const confirmed = await confirm('确定要提交吗？')
if (confirmed) {
  // 提交
}
```

### 声明式使用（组件形式）

```vue
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开确认框</UButton>
  <UMessageConfirm
    v-model="visible"
    title="提示"
    message="确认要继续操作吗？"
    cancel-button-text="取消"
    @close="visible = false"
  />
</template>
```
