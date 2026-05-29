# UNotification — 通知

> `import type { NotificationProps, NotificationExposed } from '@veltra/desktop'`

悬浮在屏幕角落的全局通知。同位置多次调用自动垂直堆叠，鼠标悬停暂停计时并展开，移出恢复。`Notification()` 是函数式 API；`UNotification` 用于声明式占位渲染。

## Import

```ts
// UNotification 由 Vite 自动导入，无需手动 import
import { Notification } from '@veltra/desktop'
```

## Props

| prop         | type                                                           | default          | 说明                                  |
| ------------ | -------------------------------------------------------------- | ---------------- | ------------------------------------- |
| `title`      | `string`                                                       | —                | 标题                                  |
| `message`    | `string`                                                       | —                | 内容                                  |
| `type`       | `ColorType`                                                    | `'primary'`      | 类型，影响图标与按钮颜色              |
| `duration`   | `number`                                                       | `4500`           | 自动关闭时长（ms），`0` 不自动关闭    |
| `closable`   | `boolean`                                                      | `false`          | 是否显示关闭按钮                      |
| `offset`     | `number`                                                       | `20`             | 距容器边缘偏移（px）                  |
| `position`   | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | 弹出位置                              |
| `icon`       | `Component`                                                    | —                | 自定义图标，不传则按 `type` 自动匹配  |
| `buttonText` | `string`                                                       | `''`             | 按钮文字，为空不显示按钮              |
| `width`      | `number`                                                       | —                | 宽度（px）                            |
| `zIndex`     | `number`                                                       | —                | CSS `z-index`（函数式调用时自动递增） |
| `id`         | `string`                                                       | —                | 唯一标识（函数式调用时自动生成）      |

`type` ↔ 默认图标：`primary→InfoFilled` / `info→QuestionFilled` / `success→CircleCheckFilled` / `warning→WarningFilled` / `danger→CircleClose`。

## 回调（通过 Props 传入，非 Emits）

| 回调      | 签名                            | 说明                       |
| --------- | ------------------------------- | -------------------------- |
| `onClick` | `(e: MouseEvent) => void`       | 点击按钮触发，自动关闭通知 |
| `onClose` | `(vm: RendererElement) => void` | 关闭（before-leave）触发   |

## Emits（仅声明式组件）

| event               | 参数              | 说明                                |
| ------------------- | ----------------- | ----------------------------------- |
| `update:modelValue` | `(value: string)` | v-model 变化                        |
| `destroy`           | —                 | 退出动画完成（函数式 API 内部使用） |

## Exposed

```ts
interface NotificationExposed {
  startTimer(): void // 重新开始自动关闭计时
  clearTimer(): void // 清除计时器
}
```

## Examples

### 函数式调用

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

### 声明式组件

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

声明式使用时占据文档流位置；全局悬浮通知推荐用函数式 API。
