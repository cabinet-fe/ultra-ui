# Message — 消息提示

> `import type { MessageProps, MessageOptions, MessageInstance, MessageType } from '@veltra/desktop'`

> 类型：`../../../generated/types/message.ts`

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

> 示例见 [examples.md](./examples.md)
