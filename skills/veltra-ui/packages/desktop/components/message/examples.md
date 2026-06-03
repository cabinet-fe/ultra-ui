# UComponent 示例

## 基础用法

```ts
// 字符串简写（默认类型）
message('这是一条消息')

// 完整选项
message({ message: '操作成功', type: 'success', duration: 5000 })
```

## 快捷方法

```ts
message.success('保存成功')
message.warn('请检查输入内容')
message.info('这是一条通知')
message.error('请求失败，请重试')
message.default('默认消息')
```

## 带配置的快捷方法

```ts
message.success('保存成功', {
  duration: 5000,
  closable: true,
  onClosed: () => console.log('消息已关闭')
})
```

## 不自动关闭

```ts
// 持续显示直到手动关闭
message.warn('请确认后再操作', { duration: 0 })
```

## HTML 内容

```ts
message.info('<strong>加粗</strong>文字', { html: true })
```

## 自定义图标

```ts
import { MyCustomIcon } from './icons'

message.success('自定义图标提示', { icon: MyCustomIcon })
```

## 手动控制关闭

```ts
const instance = message.loading('正在加载...')

// 异步完成后关闭
await doSomething()
instance.close()
```

## 使用 onClosed 链式操作

```ts
const instance = message.success('已保存')

instance.onClosed.then(() => {
  // 消息完全消失后执行
  router.push('/list')
})
```

## 关闭所有消息

```ts
// 例如路由切换时清理
router.beforeEach(() => {
  message.closeAll()
})
```

## 设置全局上下文

```ts
// main.ts 或 App.vue setup 中
import { getCurrentInstance } from 'vue'

const app = createApp(App)
message._context = app._instance?.appContext
```

## UMessage 声明式使用

```vue
<template>
  <u-message message="提示内容" type="info" />
  <u-message message="操作成功" type="success" :duration="0" closable />
  <u-message message="<b>HTML</b>" html />
</template>
```
