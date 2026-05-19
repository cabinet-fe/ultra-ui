# UMessage / UNotification — 消息与通知

> `import type { MessageProps, MessageOptions, Message, NotificationProps } from '@veltra/desktop'`

## Import

```ts
// UMessage、UNotification 由 Vite 自动导入，无需手动 import

// 函数式 API — 注意大小写
import { message, Notification } from '@veltra/desktop'
// 类型
import type { MessageProps, MessageType, NotificationProps } from '@veltra/desktop'
```

---

## UMessage 消息提示

`message()` 是全局消息提示的函数式 API，创建后自动添加到页面底部中央的消息列表，定时消失。底层渲染 `UMessage` 组件。

### 函数式 API

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

// 返回 MessageInstance
const instance = message('创建数据...')
instance.close() // 手动关闭（触发离开动画）
await instance.onClosed // 等待彻底销毁（含动画结束）

// 关闭所有
message.closeAll()
```

### 类型定义

```ts
type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

interface MessageProps {
  message?: string
  type?: MessageType
  closable?: boolean // 是否显示关闭按钮
  duration?: number // 持续时间(ms)，默认 3000
  html?: boolean // 是否渲染 HTML
  icon?: DefineComponent // 自定义图标
}

// 函数式调用时可用，比 MessageProps 多了回调
type MessageOptions = MessageProps & {
  onClose?: () => void // 关闭时触发（过渡开始）
  onClosed?: () => void // 关闭结束后触发（过渡结束，DOM 已移除）
}

interface MessageInstance {
  id: string
  close(): void
  onClosed: Promise<void>
}
```

### 快捷方法签名

```ts
message.success(msg: string, config?: MsgAliasConf): MessageInstance
message.warn(msg: string, config?: MsgAliasConf): MessageInstance
message.info(msg: string, config?: MsgAliasConf): MessageInstance
message.error(msg: string, config?: MsgAliasConf): MessageInstance
message.default(msg: string, config?: MsgAliasConf): MessageInstance
```

其中 `MsgAliasConf = Omit<MessageOptions, 'type' | 'message'>`。

### type ↔ 自动图标

| type      | 默认图标            |
| --------- | ------------------- |
| `default` | `InfoFilled`        |
| `info`    | `QuestionFilled`    |
| `success` | `CircleCheckFilled` |
| `warn`    | `WarningFilled`     |
| `error`   | `CircleClose`       |

颜色映射：`error` → `danger`，`warn` → `warning`，其余 `type` 原样输出为 `ColorType`。

### 示例

```vue
<script setup lang="ts">
import { message } from '@veltra/desktop'

async function handleSave() {
  try {
    await saveData()
    message.success('保存成功')
  } catch {
    message.error('保存失败，请重试')
  }
}

function showManualClose() {
  const msg = message({
    message: '你需要手动关闭我',
    duration: 0, // 不自动关闭
    closable: true,
    onClosed: () => console.log('消息已销毁')
  })
  setTimeout(() => msg.close(), 5000)
}
</script>

<template>
  <u-button @click="handleSave">保存</u-button>
  <u-button @click="showManualClose">手动关闭消息</u-button>
</template>
```

### 声明式组件示例

```vue
<u-message message="提示内容" type="info" :duration="3000" />
```

> **注意**：`UMessage` 是单条消息的内部组件，通常不需要直接在模板中使用。全局消息推荐使用 `message()` 函数式 API。

---

## UNotification 通知

`Notification()` 是全局悬浮通知的函数式 API，从屏幕四角弹出。同一位置多次调用自动垂直堆叠，支持鼠标悬停展开查看、移出恢复。

### 函数式 API

```ts
function Notification(options: NotificationProps): void
```

```ts
import { Notification } from '@veltra/desktop'

// 基础
Notification({ title: '操作成功', message: '数据已保存' })

// 完整配置
Notification({
  title: '删除确认',
  message: '确定要删除该数据吗？',
  type: 'danger',
  duration: 0, // 0 = 不自动关闭
  closable: true,
  position: 'top-right',
  buttonText: '撤销',
  icon: CustomIcon, // 自定义图标组件
  onClick: (e) => {
    // 点击按钮触发，自动关闭通知
    console.log('点击了按钮')
  },
  onClose: (vm) => {
    // 关闭时（before-leave）触发
    console.log('通知已关闭')
  }
})
```

### Props

| prop         | 类型                            | 默认值           | 说明                                                                 |
| ------------ | ------------------------------- | ---------------- | -------------------------------------------------------------------- |
| `title`      | `string`                        | —                | 通知标题                                                             |
| `message`    | `string`                        | —                | 通知内容                                                             |
| `type`       | `ColorType`                     | `'primary'`      | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  |
| `duration`   | `number`                        | `4500`           | 自动关闭时长（ms），`0` 不自动关闭                                   |
| `closable`   | `boolean`                       | `false`          | 是否显示关闭按钮                                                     |
| `offset`     | `number`                        | `20`             | 距容器边缘偏移量（px），函数式调用时自动管理                         |
| `position`   | `string`                        | `'bottom-right'` | `'top-left'` \| `'top-right'` \| `'bottom-left'` \| `'bottom-right'` |
| `icon`       | `DefineComponent`               | —                | 自定义图标，不传则按 `type` 自动匹配                                 |
| `buttonText` | `string`                        | `''`             | 按钮文字，为空不显示按钮                                             |
| `zIndex`     | `number`                        | —                | CSS `z-index`，函数式调用时自动递增                                  |
| `width`      | `number`                        | —                | 通知宽度（px）                                                       |
| `id`         | `string`                        | —                | 唯一标识，函数式调用时自动生成                                       |
| `onClick`    | `(e: MouseEvent) => void`       | —                | 点击按钮回调，触发后自动关闭通知                                     |
| `onClose`    | `(vm: RendererElement) => void` | —                | 关闭时（before-leave）触发                                           |

### type ↔ 默认图标

| type      | 图标                |
| --------- | ------------------- |
| `primary` | `InfoFilled`        |
| `info`    | `QuestionFilled`    |
| `success` | `CircleCheckFilled` |
| `warning` | `WarningFilled`     |
| `danger`  | `CircleClose`       |

### Emits（声明式使用）

| event               | 参数              | 说明                                |
| ------------------- | ----------------- | ----------------------------------- |
| `update:modelValue` | `(value: string)` | `modelValue` 变化时                 |
| `destroy`           | —                 | 离开动画完成后，函数式 API 内部使用 |

### Exposed

```ts
interface NotificationExposed {
  /** 重新开始自动关闭计时 */
  startTimer(): void
  /** 清除自动关闭计时器（鼠标悬停时调用） */
  clearTimer(): void
}
```

### 声明式组件示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">显示通知</UButton>
  <UNotification
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

> **注意**：声明式使用时通知占据文档流中的位置。全局悬浮通知推荐使用 `Notification()` 函数式 API。

### 批量调用堆叠行为

同一位置多次调用 `Notification()`：

- 通知自动垂直堆叠，保持间距
- 鼠标悬停 → 暂停所有定时器，展开堆叠
- 鼠标移出 → 恢复定时器，收起堆叠
- 关闭某条通知 → 其余通知重新计算位置，平滑上移/下移
