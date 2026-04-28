# UMessage / UNotification — 消息与通知

> `import type { MessageProps, NotificationProps } from '@veltra/desktop'`

## UMessage — 消息提示（函数式调用）

```ts
import { message } from '@veltra/desktop'
```

**注意**: 运行时函数是**小写** `message`，类型接口才是大写 `Message`。

### API

```ts
// 字符串参数
message('操作成功')

// 配置对象
message({ message: '操作成功', type: 'success', duration: 3000 })

// 快捷方法
message.success('保存成功')
message.error('操作失败')
message.warn('请注意')
message.info('提示信息')
message.default('默认消息')

// 关闭全部
message.closeAll()
```

### 示例

```vue
<script setup lang="ts">
import { message } from '@veltra/desktop'

function handleSave() {
  try {
    // ...保存逻辑
    message.success('保存成功')
  } catch {
    message.error('保存失败，请重试')
  }
}
</script>

<template>
  <u-button @click="handleSave">保存</u-button>
</template>
```

---

## UNotification — 通知（函数式调用）

```ts
import { Notification } from '@veltra/desktop'
```

**注意**: 函数名是**大写** `Notification`。

### API

```ts
Notification({
  title: '事件通知',
  message: '周日, 2023年12月3日 上午9:00',
  type: 'primary',        // ColorType
  duration: 4500,         // 0 = 不自动关闭
  closable: true,
  position: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  icon: CustomIcon,       // 自定义图标组件
  buttonText: '撤销',
  onClick: (vm) => {},
  onClose: (vm) => {}
})
```

### 示例

```vue
<script setup lang="ts">
import { Notification } from '@veltra/desktop'

function showSuccess() {
  Notification({
    title: '操作成功',
    message: '数据已保存',
    type: 'success',
    duration: 3000
  })
}

function showWarning() {
  Notification({
    title: '请注意',
    message: '网络连接不稳定',
    type: 'warning',
    closable: true,
    duration: 0  // 不自动关闭
  })
}
</script>

<template>
  <u-button @click="showSuccess">成功通知</u-button>
  <u-button @click="showWarning">警告通知</u-button>
</template>
```
