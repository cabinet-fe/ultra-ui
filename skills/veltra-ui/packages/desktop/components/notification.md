# Notification 通知

悬浮出现在角落的全局通知，支持声明式组件和函数式调用两种方式。

## Import

```ts
// 声明式组件
import { UNotification } from '@veltra/desktop'
// 函数式 API
import { Notification } from '@veltra/desktop'
// 类型
import type { NotificationProps } from '@veltra/desktop/types'
```

## 函数式 API

`Notification(options)` — 调用即弹出一条通知，无需在模板中声明。

### 签名

```ts
function Notification(options: NotificationProps): void
```

### 示例

```ts
import { Notification } from '@veltra/desktop'

// 基础用法
Notification({
  title: '操作成功',
  message: '数据已保存'
})

// 完整配置
Notification({
  title: '删除确认',
  message: '确定要删除该数据吗？',
  type: 'danger',
  duration: 0,         // 0 则不自动关闭
  closable: true,
  buttonText: '撤销',
  position: 'top-right',
  onClick: (e) => {
    console.log('点击了按钮')
  },
  onClose: () => {
    console.log('通知已关闭')
  }
})
```

## Props

| prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 通知标题 |
| `message` | `string` | — | 通知内容 |
| `type` | `ColorType` | `'primary'` | 通知类型，影响图标和按钮颜色 |
| `duration` | `number` | `4500` | 自动关闭时长（ms），设为 `0` 则不自动关闭 |
| `closable` | `boolean` | `false` | 是否显示关闭按钮 |
| `offset` | `number` | `20` | 距容器边缘的偏移量（px） |
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | 弹出位置 |
| `icon` | `DefineComponent` | — | 自定义图标组件，不传则按 `type` 自动匹配 |
| `buttonText` | `string` | `''` | 按钮文字，为空则不显示按钮 |
| `zIndex` | `number` | — | CSS `z-index`，函数式调用时自动递增 |
| `width` | `number` | — | 通知宽度（px） |
| `id` | `string` | — | 唯一标识，函数式调用时自动生成 |

### ColorType

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

### type 对应的默认图标

| type | 图标 |
|------|------|
| `primary` | `InfoFilled` |
| `info` | `QuestionFilled` |
| `success` | `CircleCheckFilled` |
| `warning` | `WarningFilled` |
| `danger` | `CircleClose` |

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: string)` | `modelValue` 变化时触发 |
| `destroy` | — | 退出动画完成后触发，函数式 API 内部使用 |

## Exposed

| 方法 | 说明 |
|------|------|
| `startTimer()` | 重新开始自动关闭计时 |
| `clearTimer()` | 清除自动关闭计时器 |

## 回调

以下回调通过 Props 传入，而非 Emits：

| 回调 | 签名 | 说明 |
|------|------|------|
| `onClick` | `(e: MouseEvent) => void` | 点击按钮时触发，触发后自动关闭通知 |
| `onClose` | `(vm: RendererElement) => void` | 关闭时（before-leave）触发 |

## 声明式组件示例

```vue
<template>
  <div>
    <UButton @click="visible = true">显示通知</UButton>
    <u-notification
      v-model="visible"
      title="提示"
      message="这是一条消息"
      type="success"
      :duration="3000"
      closable
      position="top-right"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UNotification } from '@veltra/desktop'

const visible = ref(false)
</script>
```

> **注意**：声明式使用时，通知会占据文档流中的位置。对于全局悬浮通知，推荐使用函数式 API `Notification()`。

## 函数式批量调用

同一位置多次调用 `Notification()` 时，通知会自动垂直堆叠并保持间距；鼠标悬停时暂停自动关闭计时器并展开堆叠，移出后恢复。
