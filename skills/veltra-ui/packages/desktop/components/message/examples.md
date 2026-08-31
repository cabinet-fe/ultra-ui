# UMessage 示例

## 基础用法

```ts
import { message } from '@veltra/desktop'

// 字符串简写（默认类型）
message('这是一条消息')

// 完整选项
message({ message: '操作成功', type: 'success', duration: 5000 })
```

## 快捷方法

```ts
import { message } from '@veltra/desktop'

message.success('保存成功')
message.warn('请检查输入内容')
message.info('这是一条通知')
message.error('请求失败，请重试')
message.default('默认消息')
```

## 带配置的快捷方法

```ts
import { message } from '@veltra/desktop'

message.success('保存成功', {
  duration: 5000,
  closable: true,
  onClosed: () => console.log('消息已关闭')
})
```

## 不自动关闭

```ts
import { message } from '@veltra/desktop'

// 持续显示直到手动关闭
message.warn('请确认后再操作', { duration: 0 })
```

## HTML 内容

```ts
import { message } from '@veltra/desktop'

message.info('<strong>加粗</strong>文字', { html: true })
```

## 自定义图标

```ts
import { message } from '@veltra/desktop'
import { CircleCheck } from '@veltra/icons/normal'

message.success('自定义图标提示', { icon: CircleCheck })
```

## 手动控制关闭

```ts
import { message } from '@veltra/desktop'

// duration 为 0 时不自动关闭，用返回的实例手动关闭
const instance = message({ message: '正在加载...', duration: 0 })

// 异步完成后关闭
await new Promise((resolve) => setTimeout(resolve, 2000))
instance.close()
```

## 使用 onClosed 链式操作

```ts
import { message } from '@veltra/desktop'

const instance = message.success('已保存')

instance.onClosed.then(() => {
  // 消息完全消失后执行，例如跳转路由：router.push('/list')
})
```

## 关闭所有消息

```ts
import { message } from '@veltra/desktop'

// 关闭当前所有消息，例如在路由切换的 beforeEach 钩子中调用
message.closeAll()
```

## 设置全局上下文

```ts
// App.vue 的 setup 中
import { getCurrentInstance } from 'vue'
import { message } from '@veltra/desktop'

const instance = getCurrentInstance()
message._context = instance?.appContext ?? null
```

## UMessage 声明式使用

```vue
<template>
  <u-message message="提示内容" type="info" />
  <u-message message="操作成功" type="success" :duration="0" closable />
  <u-message message="<b>HTML</b>" html />
</template>
```
