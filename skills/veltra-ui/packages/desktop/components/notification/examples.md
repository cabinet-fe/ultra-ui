# UNotification 示例

## 函数式调用

```ts
import { notification } from '@veltra/desktop'

// 字符串简写
notification('数据已保存')

notification({ title: '操作成功', message: '数据已保存' })

notification({
  title: '删除提醒',
  message: '确定要删除该数据吗？',
  type: 'danger',
  duration: 0,
  closable: true,
  buttonText: '撤销',
  position: 'top-right',
  onClick: () => console.log('点击了操作按钮'),
  onClose: () => console.log('触发关闭'),
  onClosed: () => console.log('动画结束')
})
```

## 快捷方法

```ts
notification.success('保存成功', {
  title: 'Success',
  position: 'bottom-right',
  duration: 4500
})

notification.primary('主要通知')
notification.info('一条信息')
notification.warning('请注意', { duration: 0, closable: true })
notification.danger('操作失败')
```

## 手动关闭与 onClosed

```ts
const instance = notification.success('正在处理…', { duration: 0 })

// 手动关闭
instance.close()

// 彻底关闭（含离开动画）后的 Promise
await instance.onClosed
```

## 关闭所有通知

```ts
// 关闭全部方位
notification.closeAll()

// 仅关闭指定方位
notification.closeAll('top-right')
```

## 声明式组件

```vue
<template>
  <u-notification
    title="提示"
    message="这是一条消息"
    type="success"
    :duration="3000"
    closable
    button-text="查看"
    @close="onClose"
    @action="onAction"
  />
</template>
```
