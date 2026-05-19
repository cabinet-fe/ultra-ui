# Message — 消息提示

> `import type { MessageProps, MessageOptions, MessageInstance, MessageType } from '@veltra/desktop'`

## Import

```ts
import { message } from '@veltra/desktop'
// UMessage 由 Vite 自动导入，无需手动 import
```

> `message` 是函数式 API，通过渲染顶层 DOM 创建消息。`UMessage` 是 SFC 组件，适用于在已存在的组件模板中声明式使用。

## 函数式 API

### 快捷方法

```ts
message.success(text, config?)   // 成功
message.info(text, config?)      // 信息
message.warn(text, config?)      // 警告
message.error(text, config?)     // 错误
message.default(text, config?)   // 默认
```

### 基础调用

```ts
message(options: MessageOptions | string): MessageInstance
```

### 返回值: MessageInstance

| 属性/方法  | 类型            | 说明                                 |
| ---------- | --------------- | ------------------------------------ |
| `id`       | `string`        | 消息唯一标识                         |
| `close()`  | `() => void`    | 手动关闭消息（触发离开动画）         |
| `onClosed` | `Promise<void>` | 消息完全销毁后 resolve（含动画结束） |

### 全局方法

```ts
message.closeAll() // 关闭所有当前显示的消息
```

### 设置渲染上下文

```ts
// 在 setup 中设置，以确保 message 能使用正确的 app context（注入、组件等）
import { getCurrentInstance } from 'vue'

message._context = getCurrentInstance()!.appContext
```

## Options

### MessageOptions extends MessageProps

| 选项       | 类型              | 默认        | 说明                                                            |
| ---------- | ----------------- | ----------- | --------------------------------------------------------------- |
| `message`  | `string`          | —           | 消息内容                                                        |
| `type`     | `MessageType`     | `'default'` | `'success'` \| `'warn'` \| `'info'` \| `'error'` \| `'default'` |
| `duration` | `number`          | `3000`      | 自动关闭时长（ms），设为 `0` 则不自动关闭                       |
| `closable` | `boolean`         | —           | 显示关闭按钮                                                    |
| `html`     | `boolean`         | —           | 将 `message` 内容作为 HTML 渲染                                 |
| `icon`     | `DefineComponent` | —           | 自定义图标组件，传入则覆盖类型默认图标                          |
| `onClose`  | `() => void`      | —           | 点击关闭时回调（触发离开动画前）                                |
| `onClosed` | `() => void`      | —           | 消息完全销毁后回调（含动画结束）                                |

### MessageType

- `'success'` — 图标 `CircleCheckFilled`，颜色 `success`
- `'warn'` — 图标 `WarningFilled`，颜色 `warning`
- `'info'` — 图标 `QuestionFilled`，颜色 `info`
- `'error'` — 图标 `CircleClose`，颜色 `danger`
- `'default'` — 图标 `InfoFilled`，颜色 `default`

## UMessage 组件（声明式）

### Props (MessageProps)

| prop       | type              | default     | 说明               |
| ---------- | ----------------- | ----------- | ------------------ |
| `message`  | `string`          | —           | 消息内容           |
| `type`     | `MessageType`     | `'default'` | 渲染样式           |
| `duration` | `number`          | `3000`      | 自动关闭时长（ms） |
| `closable` | `boolean`         | —           | 是否可以关闭       |
| `html`     | `boolean`         | —           | 渲染 HTML          |
| `icon`     | `DefineComponent` | —           | 自定义图标         |
| `offset`   | `number`          | `20`        | 垂直偏移           |

### Emits

| event   | 参数       |
| ------- | ---------- |
| `close` | — 触发关闭 |

## Examples

### 基础用法

```ts
// 字符串简写（默认类型）
message('这是一条消息')

// 完整选项
message({ message: '操作成功', type: 'success', duration: 5000 })
```

### 快捷方法

```ts
message.success('保存成功')
message.warn('请检查输入内容')
message.info('这是一条通知')
message.error('请求失败，请重试')
message.default('默认消息')
```

### 带配置的快捷方法

```ts
message.success('保存成功', {
  duration: 5000,
  closable: true,
  onClosed: () => console.log('消息已关闭')
})
```

### 不自动关闭

```ts
// 持续显示直到手动关闭
message.warn('请确认后再操作', { duration: 0 })
```

### HTML 内容

```ts
message.info('<strong>加粗</strong>文字', { html: true })
```

### 自定义图标

```ts
import { MyCustomIcon } from './icons'

message.success('自定义图标提示', { icon: MyCustomIcon })
```

### 手动控制关闭

```ts
const instance = message.loading('正在加载...')

// 异步完成后关闭
await doSomething()
instance.close()
```

### 使用 onClosed 链式操作

```ts
const instance = message.success('已保存')

instance.onClosed.then(() => {
  // 消息完全消失后执行
  router.push('/list')
})
```

### 关闭所有消息

```ts
// 例如路由切换时清理
router.beforeEach(() => {
  message.closeAll()
})
```

### 设置全局上下文

```ts
// main.ts 或 App.vue setup 中
import { getCurrentInstance } from 'vue'

const app = createApp(App)
message._context = app._instance?.appContext
```

### UMessage 声明式使用

```vue
<template>
  <u-message message="提示内容" type="info" />
  <u-message message="操作成功" type="success" :duration="0" closable />
  <u-message message="<b>HTML</b>" html />
</template>
```
