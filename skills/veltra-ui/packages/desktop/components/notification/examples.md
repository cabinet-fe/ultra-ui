# UNotification 示例

## 函数式调用

```ts
import { Notification } from '@veltra/desktop'

Notification({ title: '操作成功', message: '数据已保存' })

Notification({
  title: '删除确认',
  message: '确定要删除该数据吗？',
  type: 'danger',
  duration: 0,
  closable: true,
  buttonText: '撤销',
  position: 'top-right',
  onClick: () => console.log('点击了按钮'),
  onClose: () => console.log('通知已关闭')
})
```

## 声明式组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">显示通知</u-button>
  <u-notification
    v-model="visible"
    title="提示"
    message="这是一条消息"
    type="success"
    :duration="3000"
    closable
    position="top-right"
  />
</template>
```
