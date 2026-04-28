# UMessage — 消息提示

> `import type { MessageProps } from '@veltra/desktop'`

## Import

```ts
import { UMessage, message } from '@veltra/desktop'
```

## Props (UMessage)

| prop | type | default | 说明 |
|------|------|---------|------|
| `message` | `string` | — | 消息内容 |
| `type` | `MessageType` | — | `'success'` \| `'warn'` \| `'info'` \| `'error'` \| `'default'` |
| `closable` | `boolean` | — | 是否可以关闭 |
| `duration` | `number` | `3000` | 持续时间 |
| `html` | `boolean` | — | 渲染 HTML |
| `icon` | `DefineComponent` | — | 图标 |

## 编程式 API

```ts
message('操作成功')
message.success('成功提示')
message.warn('警告提示')
message.info('信息提示')
message.error('错误提示')
message.default('默认提示')
message.closeAll()
```

## Examples

```vue
<u-message message="提示内容" type="info" />
```
