---
title: notification / UNotification 通知
description: 从 @veltra/desktop 导入 notification 函数式通知条，按屏幕四角方位堆叠弹出，支持 primary/success/info/warning/danger 类型、操作按钮与回调、悬停暂停计时与展开堆叠、closeAll 按方位清空；也可用 UNotification 组件声明式渲染。
aliases: [UNotification, Notification, 通知条, 消息通知, Notification 通知]
keywords: [NotificationPosition, NotificationOptions, NotificationInstance, buttonText, onClick, onClose, onClosed, offset, position, zIndex, top-right, bottom-right, components/notification/style, 右下角弹出, 撤销操作, 消息提醒, 悬停展开, 自动关闭, 样式副作用, 样式未引入]
---

# notification / UNotification 通知

`@veltra/desktop` 导出函数式 API `notification` 与组件 `UNotification`。`notification()` 在屏幕四角之一弹出通知条并按方位堆叠，默认右下角、4500ms 自动关闭；提供 `primary` / `success` / `info` / `warning` / `danger` 快捷方法、`buttonText` 操作按钮（可配 `onClick` 回调）与按方位 `closeAll(position?)`。

## 快速上手

```ts
import { notification } from '@veltra/desktop'
// 样式是独立入口，必须显式引入；宿主模板里出现过 UNotification 并由 VeltraUIResolver 自动引入时可省
import '@veltra/desktop/components/notification/style'

// 字符串简写，等价于 notification({ message: '数据已保存' })
notification('数据已保存')

// 完整选项：默认 position 'bottom-right'，4500ms 自动关闭
const instance = notification({
  title: '操作成功',
  message: '日程已写入日历',
  type: 'success',
  position: 'top-right',
})

await instance.onClosed // => Promise<void>，含离场动画在内的彻底关闭后兑现
```

调用时机：`notification` 直接在 `document.body` 上创建容器并渲染，不依赖 Vue 应用挂载，导入后即可在事件回调、轮询任务、WebSocket 消息处理中调用；仅要求浏览器环境（SSR 下只能在客户端生命周期中调用）。

## API 签名

```ts
import type { AppContext, DefineComponent } from 'vue'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 颜色类型 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 通知弹出方位 */
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** 通知属性，函数式选项的基础 */
export interface NotificationProps {
  /** 标题，为空则不显示 */
  title?: string
  /** 内容 */
  message?: string
  /** 颜色类型。默认 'primary' */
  type?: ColorType
  /** 是否显示关闭按钮。默认 false；duration 为 0 时关闭按钮始终显示 */
  closable?: boolean
  /** 自动关闭时长，单位 ms，0 表示常驻。默认 4500 */
  duration?: number
  /** 自定义图标组件；不传时按 type 取内置图标 */
  icon?: DefineComponent
  /** 操作按钮文字，为空则不显示按钮。默认 '' */
  buttonText?: string
  /** 尺寸。默认 'default' */
  size?: ComponentSize
}

/** 函数式调用选项 */
export interface NotificationOptions extends NotificationProps {
  /** 弹出方位。默认 'bottom-right' */
  position?: NotificationPosition
  /** 距屏幕边缘的偏移，单位 px。默认 20 */
  offset?: number
  /** 层级；不传时由全局自增计数（1000 起）分配 */
  zIndex?: number
  /** 点击操作按钮时回调 */
  onClick?: (e: MouseEvent) => void
  /** 触发关闭时回调 */
  onClose?: () => void
  /** 关闭动画结束后回调 */
  onClosed?: () => void
}

/** 快捷方法第二参数类型：不含 type 与 message */
type NotificationShortcutConfig = Omit<NotificationOptions, 'type' | 'message'>

/** 通知实例 */
export interface NotificationInstance {
  /** 唯一标识，形如 notification_0、notification_1 */
  id: string
  /** 手动关闭该通知 */
  close(): void
  /** 彻底关闭（含动画结束）后兑现的 Promise */
  onClosed: Promise<void>
}

/** 函数式通知 API */
export interface Notification {
  (options: NotificationOptions | string): NotificationInstance
  primary(message: string, config?: NotificationShortcutConfig): NotificationInstance
  success(message: string, config?: NotificationShortcutConfig): NotificationInstance
  info(message: string, config?: NotificationShortcutConfig): NotificationInstance
  warning(message: string, config?: NotificationShortcutConfig): NotificationInstance
  danger(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 关闭所有通知，可指定方位 */
  closeAll(position?: NotificationPosition): void
  /** 全局渲染上下文，默认 null */
  _context: AppContext | null
}

export const notification: Notification
```

## 参数说明

`notification(options)` 选项（快捷方法第二参数 `config` 相同，但不含 `type` / `message`）：

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `message` | `string` | — | 否 | 与 `title` 至少传一个，否则通知无内容 |
| `title` | `string` | — | 否 | 显示在内容上方 |
| `type` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 否 | 快捷方法固定该值 |
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | 否 | 每个方位一个独立堆叠容器 |
| `duration` | `number` | `4500` | 否 | 单位 ms；`0` 表示常驻，此时关闭按钮始终显示 |
| `closable` | `boolean` | `false` | 否 | — |
| `offset` | `number` | `20` | 否 | 单位 px，作用于该方位整个容器的上下与左右边距 |
| `zIndex` | `number` | 全局自增（1000 起） | 否 | 作用于该方位整个容器 |
| `buttonText` | `string` | `''` | 否 | 为空时不渲染操作按钮 |
| `icon` | `DefineComponent` | 按 `type` 取内置图标 | 否 | 内置映射见「方法与事件」 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | — |
| `onClick` | `(e: MouseEvent) => void` | — | 否 | 点击 `buttonText` 操作按钮时触发，触发后该通知自动关闭 |
| `onClose` | `() => void` | — | 否 | 计时结束 / 点关闭按钮 / 点操作按钮时触发 |
| `onClosed` | `() => void` | — | 否 | 离场动画结束后触发 |

`UNotification` 组件（声明式）只接收 `NotificationProps`，事件见「方法与事件」。

## 方法与事件

按 `type` 的内置图标映射：`primary`→`InfoFilled`、`info`→`QuestionFilled`、`success`→`CircleCheckFilled`、`warning`→`WarningFilled`、`danger`→`CircleClose`（均来自 `@veltra/icons/normal`）。

实例与全局方法行为：

- `notification(...)` 同步返回 `NotificationInstance`，不抛错。
- `instance.close()`：同步，立即触发离场动画；`instance.onClosed` 在动画结束后兑现，从不 reject。
- `notification.closeAll()`：关闭全部 4 个方位的所有通知。
- `notification.closeAll(position)`：仅清空指定方位。
- 点击 `buttonText` 操作按钮：先触发 `onClick(e)`，再触发 `onClose()` 并自动关闭该通知。
- 计时规则：鼠标悬停在通知上暂停倒计时并展开堆叠，移开后按剩余时长继续。

堆叠规则：同一方位按调用顺序堆叠，最新通知在最前；折叠态最多露出 3 层（第 4 条起隐藏，仅最前一条可交互），悬停容器展开全部。

`UNotification` 组件事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `close` | 无 | 计时结束或点击关闭按钮 |
| `action` | `evt: MouseEvent` | 点击操作按钮 |

## 典型示例

### 带操作按钮的撤销通知

```ts
import { notification } from '@veltra/desktop'

function notifyDelete() {
  notification({
    title: '已删除 1 条记录',
    message: '可在 10 秒内撤销本次操作。',
    type: 'warning',
    duration: 10000,
    buttonText: '撤销',
    onClick: () => console.log('用户点击了撤销'), // 点击后该通知自动关闭
    onClose: () => console.log('开始关闭'),
    onClosed: () => console.log('彻底关闭'),
  })
}
```

### 快捷方法 + 按方位 closeAll

```ts
import { notification } from '@veltra/desktop'

// 快捷方法第二参数不含 type / message
notification.success('保存成功', { title: 'Success', position: 'top-right' })
notification.warning('请注意', { duration: 0, closable: true }) // 0 表示常驻
notification.danger('操作失败')

// 仅清空右上角；不传参数则清空全部 4 个方位
notification.closeAll('top-right')
```

### 常驻通知 + 手动关闭

```ts
import { notification } from '@veltra/desktop'

// duration: 0 常驻，关闭按钮始终显示
const instance = notification.primary('正在同步数据…', { duration: 0 })

setTimeout(() => {
  instance.close()
  instance.onClosed.then(() => console.log('同步通知已彻底关闭'))
}, 3000)
```

声明式用法（`UNotification` 渲染在文档流内，不带定位与堆叠）：

```vue
<script setup lang="ts">
import { UNotification } from '@veltra/desktop'

function onAction(e: MouseEvent) {
  console.log('点击了操作按钮', e)
}
</script>

<template>
  <UNotification
    title="提醒"
    message="这是一条消息"
    type="success"
    closable
    button-text="查看"
    @action="onAction"
  />
</template>
```

## 注意事项

> [!WARNING]
> - 快捷方法是 `warning` / `danger`，本库通知没有 `error` 快捷方法；`message` 的快捷方法才是 `warn` / `error`。
> - `offset` 与 `zIndex` 作用于整个方位容器：同一方位后弹出的通知会以最新一次调用的 `offset` / `zIndex` 更新容器。
> - 折叠态下只有最前一条通知可交互，第 4 条起不可见但仍计入堆叠；需要查看全部要悬停展开。
> - `instance.onClosed` 是 Promise 属性，不是方法；写成 `instance.onClosed()` 会抛 `TypeError`。
> - `notification` 是函数式 API，不经过模板编译，`VeltraUIResolver` 不会为它引入样式。只安装了组件库、未在模板里用 `UNotification` 时，必须 `import '@veltra/desktop/components/notification/style'`，或在入口 `import '@veltra/desktop/style'` 引全量样式。缺少样式时的症状是容器与条目都渲染出来、位置也对（容器定位由 JS 内联样式写死），但条目没有宽度、边框、背景色与文字颜色，不是「通知没弹出来」。
> - 需要主题 token：入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` 为空、通知无颜色。
> - 需要让通知树内组件访问应用级 `provide` / 全局注册组件时，在 `setup` 中设置 `notification._context = getCurrentInstance()?.appContext ?? null`。

## 常见问题

### 调用后通知没有出现

先确认两件事：`message` / `title` 至少传了一个；主题已初始化（`loadTheme()`）。若方位设了 `top-left` 等而被其他固定定位元素盖住，传入更大的 `zIndex`：

```ts
import { notification } from '@veltra/desktop'

notification({ message: '置顶显示', position: 'top-right', zIndex: 99999 })
```

### 通知出现了但没有颜色 / 条目样式错乱

两种原因，按 DevTools 里能否查到 `--u-*` 变量区分。

- `html` 元素上没有 `--u-*` 变量（Styles 面板搜不到 `--u-color-primary`）：主题未初始化。修复（应用入口执行一次）：

  ```ts
  import '@veltra/styles/normalize'
  import { loadTheme } from '@veltra/styles/theme'

  loadTheme()
  ```

- `--u-*` 变量在，但 Styles 面板搜不到 `.u-notification` 规则：样式未引入。`notification` 是函数式 API，不经过模板编译，模板里没用 `UNotification` 时 resolver 不会注入样式；容器的 `position` / 偏移由 JS 内联写入，所以位置正常、条目本身没有宽度与配色。修复（应用入口或调用 `notification` 的文件里引入）：

  ```ts
  import '@veltra/desktop/components/notification/style'
  // 或引全量样式：import '@veltra/desktop/style'
  ```
