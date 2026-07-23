# UMessageConfirm 示例

## 基础确认（仅确认按钮）

```ts
import { messageConfirm } from '@veltra/desktop'

// 字符串简写
messageConfirm('操作成功')

// 完整选项
messageConfirm({ message: '操作成功' })
```

## 带取消按钮

```ts
messageConfirm({ message: '确定要删除该项吗？', cancelButtonText: '取消' })
```

## 带回调与 onClosed

```ts
const instance = messageConfirm({
  title: '删除确认',
  message: '删除后数据无法恢复，确定要继续吗？',
  confirmButtonText: '确认删除',
  cancelButtonText: '取消',
  confirmButtonType: 'danger',
  onClose: (action) => {
    if (action === 'confirm') {
      api.deleteItem(id)
    }
  }
})

// 彻底关闭（含离开动画）后的 Promise，值为 'confirm' | 'cancel'
instance.onClosed.then((action) => {
  console.log('完全关闭:', action)
})
```

## 快捷方法

```ts
// 第二参数为配置对象（非回调），会固定 confirmButtonType
messageConfirm.danger('此操作不可逆，确认继续？', {
  cancelButtonText: '取消',
  onClose: (action) => {
    if (action === 'confirm') {
      // ...
    }
  }
})

messageConfirm.success('数据已保存，确认关闭？')
messageConfirm.primary('请确认继续')
messageConfirm.info('请阅读说明后确认')
messageConfirm.warning('配置尚未保存，确认离开？', { cancelButtonText: '取消' })
```

## 使用 onClosed 等待结果

```ts
const action = await messageConfirm({
  message: '确定要提交吗？',
  cancelButtonText: '取消'
}).onClosed

if (action === 'confirm') {
  // 提交
}
```

## 手动关闭与 closeAll

```ts
const instance = messageConfirm({ message: '处理中…', cancelButtonText: '取消' })

// 手动关闭；未传 action 时视为 'cancel'
instance.close('confirm')

// 关闭当前全部确认框
messageConfirm.closeAll()
```

## 声明式组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { MessageConfirmAction } from '@veltra/desktop'

const visible = ref(false)

function handleClose(action: MessageConfirmAction) {
  visible.value = false
  if (action === 'confirm') {
    // ...
  }
}
</script>

<template>
  <UButton @click="visible = true">打开确认框</UButton>
  <UMessageConfirm
    v-if="visible"
    title="提示"
    message="确认要继续操作吗？"
    cancel-button-text="取消"
    @close="handleClose"
  />
</template>
```
