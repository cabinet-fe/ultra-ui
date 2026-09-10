---
title: message / UMessage 全局消息
description: 从 @veltra/desktop 导入 message 函数式 API，在页面顶部居中弹出自动消失的全局消息，支持 success/warn/info/error/default 五种类型、手动关闭、closeAll 一键清空与 html 内容渲染；也可用 UMessage 组件声明式渲染单条消息。
aliases: [UMessage, Message, 消息提示, Toast, 全局提示]
keywords: [MessageType, MessageOptions, MessageInstance, closeAll, onClosed, onClose, closable, duration, html, icon, components/message/style, 函数式调用, 手动关闭, 不自动关闭, 常驻, 悬停暂停, 自定义图标, 消息提示, 样式副作用, 样式未引入]
---

# message / UMessage 全局消息

`@veltra/desktop` 导出函数式 API `message` 与组件 `UMessage`。`message()` 在页面顶部居中弹出轻量全局消息，默认 3000ms 后自动消失；提供 `success` / `warn` / `info` / `error` / `default` 五个快捷方法、实例级 `close()` 手动关闭与 `closeAll()` 一键清空。`UMessage` 用于在模板中声明式渲染单条消息。

## 快速上手

```ts
import { message } from '@veltra/desktop'
// 样式是独立入口，必须显式引入；宿主模板里出现过 UMessage 并由 VeltraUIResolver 自动引入时可省
import '@veltra/desktop/components/message/style'

// 字符串简写，等价于 message({ message: '已保存' })
const instance = message('已保存')

// 完整选项
message({ message: '操作成功', type: 'success', duration: 5000 })

// duration 默认 3000ms，计时结束自动关闭
await instance.onClosed // => Promise<void>，包含离场动画在内的彻底关闭后兑现
```

调用时机：`message` 直接在 `document.body` 上创建容器并渲染，不依赖 Vue 应用挂载——导入后即可在事件回调、路由守卫、全局 store 中调用，仅要求浏览器环境（SSR 下只能在客户端生命周期中调用）。

## API 签名

```ts
import type { AppContext, DefineComponent } from 'vue'

/** 消息类型 */
export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

/** 消息属性，也是函数式选项的基础 */
export interface MessageProps {
  /** 消息内容。默认 '' */
  message?: string
  /** 渲染样式。默认 'default' */
  type?: MessageType
  /** 是否显示关闭按钮。默认 false；duration 为 0 时关闭按钮始终显示 */
  closable?: boolean
  /** 持续时间，单位 ms；0 表示不自动关闭。默认 3000 */
  duration?: number
  /** 以 HTML 渲染 message（v-html 实现）。默认 false */
  html?: boolean
  /** 自定义图标组件；不传时按 type 取内置图标 */
  icon?: DefineComponent
}

/** 函数式调用选项 */
export type MessageOptions = MessageProps & {
  /** 开始关闭（计时结束或点击关闭按钮）时回调 */
  onClose?: () => void
  /** 彻底关闭（含离场动画结束）后回调 */
  onClosed?: () => void
}

/** 快捷方法第二参数类型：不含 type 与 message */
type MsgAliasConf = Omit<MessageOptions, 'type' | 'message'>

/** 单条消息实例 */
export interface MessageInstance {
  /** 消息唯一标识，形如 msg_0、msg_1 */
  id: string
  /** 手动关闭该消息 */
  close(): void
  /** 彻底销毁（含动画结束）后兑现的 Promise */
  onClosed: Promise<void>
}

/** 函数式消息 API */
export interface Message {
  (options: MessageOptions | string): MessageInstance
  /** 关闭当前所有消息 */
  closeAll(): void
  success(message: string, config?: MsgAliasConf): MessageInstance
  warn(message: string, config?: MsgAliasConf): MessageInstance
  info(message: string, config?: MsgAliasConf): MessageInstance
  error(message: string, config?: MsgAliasConf): MessageInstance
  default(message: string, config?: MsgAliasConf): MessageInstance
  /** 全局渲染上下文，默认 null */
  _context: AppContext | null
}

export const message: Message
```

## 参数说明

函数式选项（`message(options)` 的字段，快捷方法第二参数 `config` 相同但不含 `type` / `message`）：

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `message` | `string` | `''` | 否 | `html: true` 时按 HTML 字符串渲染，内容必须来自可信来源 |
| `type` | `'success' \| 'warn' \| 'info' \| 'error' \| 'default'` | `'default'` | 否 | 快捷方法固定对应 type，`config` 中不可再传 |
| `closable` | `boolean` | `false` | 否 | `duration: 0` 时无论取值如何都显示关闭按钮 |
| `duration` | `number` | `3000` | 否 | 单位 ms；`0` 表示常驻不自动关闭 |
| `html` | `boolean` | `false` | 否 | 用 `v-html` 渲染 `message` |
| `icon` | `DefineComponent` | 按 `type` 取内置图标 | 否 | 内置映射见「方法与事件」 |
| `onClose` | `() => void` | — | 否 | 计时结束或点击关闭按钮时触发 |
| `onClosed` | `() => void` | — | 否 | 离场动画结束后触发；`closeAll()` 关闭的消息也触发 |

`UMessage` 组件（声明式）只接收 `MessageProps`，事件见「方法与事件」。

## 方法与事件

按 `type` 的内置图标与颜色映射（`warn` 用 warning 色，`error` 用 danger 色）：

| `type` | 图标 | 颜色 |
| --- | --- | --- |
| `default` | `InfoFilled` | default |
| `info` | `QuestionFilled` | info |
| `success` | `CircleCheckFilled` | success |
| `warn` | `WarningFilled` | warning |
| `error` | `CircleClose` | danger |

实例行为（均来自 `message` 返回值）：

- `message(...)` 同步返回 `MessageInstance`，不抛错。
- `instance.close()`：同步，立即触发离场动画；`instance.onClosed` 在动画结束后兑现，从不 reject。
- `message.closeAll()`：同步清空当前所有消息并触发离场动画；每条的 `onClosed` 照常兑现。
- 计时规则：鼠标悬停在消息上暂停倒计时，移开后按剩余时长继续倒计时。

`UMessage` 组件事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `close` | 无 | 计时结束或点击关闭按钮；组件不会自行移除，必须监听后由业务移除节点 |

## 典型示例

### 提交时先弹常驻消息，完成后手动关闭

```ts
import { message } from '@veltra/desktop'

async function submit() {
  // duration: 0 表示常驻，关闭按钮始终显示
  const instance = message({ message: '正在提交…', duration: 0 })
  try {
    await fetch('/api/submit', { method: 'POST' })
    instance.close() // 手动关闭常驻消息
    message.success('提交成功', {
      duration: 5000,
      onClosed: () => console.log('消息已彻底关闭'), // 含离场动画
    })
  } catch {
    instance.close()
    message.error('提交失败，请重试')
  }
}
```

### HTML 内容与自定义图标

```vue
<script setup lang="ts">
import { message } from '@veltra/desktop'
import { CircleCheck } from '@veltra/icons/normal'

function notify() {
  // html: true 时 message 按 HTML 渲染，内容必须来自可信来源
  message.info('<strong>工单</strong>已创建', { html: true })
  message.success('自定义图标提示', { icon: CircleCheck, closable: true })
}
</script>

<template>
  <button @click="notify">弹出消息</button>
</template>
```

### closeAll 清空与声明式 UMessage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMessage, message } from '@veltra/desktop'

const visible = ref(true)

// 路由切换等场景一键清空全部消息
function onRouteChange() {
  message.closeAll()
}
</script>

<template>
  <UMessage v-if="visible" message="静态提示" type="info" @close="visible = false" />
  <button @click="onRouteChange">closeAll</button>
</template>
```

## 注意事项

> [!WARNING]
> - 本库快捷方法是 `warn` / `error`，不是 Element Plus / Ant Design 风格的 `warning`；`messageConfirm` 与 `notification` 的快捷方法才是 `warning` / `danger`。
> - 消息固定出现在页面顶部居中（挂载在 `document.body` 的 `ul.u-message__container`），本库不提供 `position` / `offset` 配置，不是从右上角弹出。
> - `message` 是函数式 API，不经过模板编译，`VeltraUIResolver` 不会为它引入样式。只安装了组件库、未在模板里用 `UMessage` 时，必须 `import '@veltra/desktop/components/message/style'`，或在入口 `import '@veltra/desktop/style'` 引全量样式。缺少样式时的症状是容器与条目都渲染出来但无颜色、无定位样式（`ul.u-message__container` 没有 `position: fixed`），不是「消息没弹出来」。
> - `html: true` 用 `v-html` 渲染，禁止拼接用户输入，否则产生 XSS。
> - `instance.onClosed` 是实例上的 Promise 属性，不是方法；写成 `instance.onClosed()` 会抛 `TypeError: instance.onClosed is not a function`。
> - 函数式消息需要主题 token：入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则消息无颜色。
> - 需要让消息树内的组件访问应用级 `provide` / 全局注册组件时，在 `setup` 中设置 `message._context = getCurrentInstance()?.appContext ?? null`；默认 `null` 也能正常弹出。

## 常见问题

### 调用后消息弹出但全部无色 / 样式错乱

两种原因，按 DevTools 里能否查到 `--u-*` 变量区分。

- `html` 元素上没有 `--u-*` 变量（Styles 面板搜不到 `--u-color-primary`）：主题未初始化。修复（应用入口执行一次）：

  ```ts
  import '@veltra/styles/normalize'
  import { loadTheme } from '@veltra/styles/theme'

  loadTheme()
  ```

- `--u-*` 变量在，但 Styles 面板搜不到 `.u-message__container` / `.u-message` 规则：样式未引入。`message` 是函数式 API，不经过模板编译，模板里没用 `UMessage` 时 resolver 不会注入样式。修复（应用入口或调用 `message` 的文件里引入）：

  ```ts
  import '@veltra/desktop/components/message/style'
  // 或引全量样式：import '@veltra/desktop/style'
  ```

### SSR 报 `ReferenceError: document is not defined`

原因：`message` 直接操作 `document.body`。修复：把调用移到客户端生命周期（`onMounted`、事件回调）中，禁止在服务端渲染期间调用。
