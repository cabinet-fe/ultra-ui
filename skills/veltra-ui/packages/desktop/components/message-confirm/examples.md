# UComponent 示例

## 基础确认（仅确认按钮）

```ts
import { MessageConfirm } from '@veltra/desktop'

MessageConfirm({ message: '操作成功' })
```

## 带取消按钮

```ts
MessageConfirm({ message: '确定要删除该项吗？', cancelButtonText: '取消' })
```

## 带回调

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

## 快捷方法

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

## 封装为 Promise

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

## 声明式使用（组件形式）

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
