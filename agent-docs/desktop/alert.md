---
title: UAlert 警告提示
description: '@veltra/desktop 导出的行内提示条组件，用于页面内常驻的信息、成功、警告、错误横幅。支持标题与描述、语义图标、closable 关闭；非浮层、不自动消失。'
aliases: [UAlert, Alert, 警告提示, 提示条, ElAlert]
keywords:
  [
    AlertProps,
    AlertEmits,
    AlertType,
    type,
    title,
    description,
    showIcon,
    closable,
    行内提示,
    提示条,
    横幅,
    banner,
    关闭事件,
    错误提示,
    警告提示
  ]
---

# UAlert 警告提示

`@veltra/desktop` 导出行内提示条组件 `UAlert`，渲染为一个占据文档流的 `<div>` 横幅，用于页面内常驻的信息、成功、警告、错误提示。支持 `type` 四种语义类型、`title` 标题与 `description` 描述、`showIcon` 语义图标、`closable` 关闭图标。非浮层：不遮挡内容、不自动消失。

## 快速上手

```vue
<script setup lang="ts">
import { UAlert } from '@veltra/desktop'
import { shallowRef } from 'vue'

const visible = shallowRef(true)

// closable 关闭时组件自行隐藏并发出 close 事件，此处只做联动处理
function handleClose() {
  console.log('alert closed')
}
</script>

<template>
  <u-alert v-if="visible" type="success" title="保存成功" description="数据已写入服务器。" />
  <u-alert type="warning" title="注意" closable @close="handleClose" />
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、提示条无颜色。

## API 签名

```ts
/** 行内提示条语义类型 */
export type AlertType = 'info' | 'success' | 'warning' | 'error'

/** 行内提示条组件属性 */
export interface AlertProps {
  /** 语义类型，默认 'info' */
  type?: AlertType
  /** 标题 */
  title?: string
  /** 描述文案，默认插槽可替代 */
  description?: string
  /** 是否显示语义图标 */
  showIcon?: boolean
  /** 是否显示关闭图标 */
  closable?: boolean
}

export interface AlertEmits {
  (e: 'close'): void
}

export interface AlertExposed {}
```

## 参数说明

| 参数          | 类型                                          | 默认     | 必填 | 约束                                         |
| ------------- | --------------------------------------------- | -------- | :--: | -------------------------------------------- |
| `type`        | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` |  否  | 四种语义色；`error` 取主题 danger 色         |
| `title`       | `string`                                      | —        |  否  | 标题文字；可用 `#title` 插槽替代             |
| `description` | `string`                                      | —        |  否  | 描述文案；可用默认插槽替代                   |
| `showIcon`    | `boolean`                                     | `false`  |  否  | 为 `true` 时标题左侧显示对应语义图标         |
| `closable`    | `boolean`                                     | `false`  |  否  | 为 `true` 时右侧显示关闭图标，点击后隐藏组件 |

插槽：`#title` 放标题内容；默认插槽放描述内容（与 `description` 属性二选一，插槽优先）。暴露：`AlertExposed` 为空对象，无可用方法或属性。

## 方法与事件

| 事件    | payload | 触发时机                                                                   |
| ------- | ------- | -------------------------------------------------------------------------- |
| `close` | 无      | `closable` 为 `true` 时点击关闭图标；组件随后隐藏自身，不移除 DOM 外的数据 |

`close` 触发后组件内部 `v-if` 置为 false、自身从页面消失；若该提示由 `v-for` 数据渲染，是否清理数据源由调用方决定。

## 典型示例

### 四种语义类型

```vue
<script setup lang="ts">
import { UAlert } from '@veltra/desktop'
import type { AlertType } from '@veltra/desktop'

const types: AlertType[] = ['info', 'success', 'warning', 'error']
</script>

<template>
  <u-alert v-for="item of types" :key="item" :type="item" :title="item" show-icon />
</template>
```

### 标题加描述

```vue
<script setup lang="ts">
import { UAlert } from '@veltra/desktop'
</script>

<template>
  <u-alert type="error" title="提交失败" description="网络连接超时，请检查网络后重试。" show-icon />
</template>
```

### 可关闭并清理数据源

```vue
<script setup lang="ts">
import { UAlert } from '@veltra/desktop'
import type { AlertType } from '@veltra/desktop'
import { shallowRef } from 'vue'

const alerts = shallowRef<Array<{ type: AlertType; title: string }>>([
  { type: 'info', title: '提示一' },
  { type: 'warning', title: '提示二' }
])

function handleClose(index: number) {
  alerts.value = alerts.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-alert
    v-for="(item, index) in alerts"
    :key="item.title"
    :type="item.type"
    :title="item.title"
    closable
    @close="handleClose(index)"
  />
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库标题属性是 `title`，不是 AntD 的 `message`，也不是属性式 `label`；描述是 `description`。
> - `UAlert` 是行内常驻横幅：不自动消失、不浮于内容之上。需要自动消失的轻提示用 `message`；需要四角堆叠的通知用 `notification`。
> - `closable` 的关闭行为是「组件自身隐藏」，不需要父级再写 `v-if` 控制；把提示挂在 `v-for` 数据上时才需要在 `close` 回调里清理数据。
> - 没有 AntD 的 `banner`、`closeText`、`afterClose` 属性；需要文字按钮关闭时用插槽组合 `#title` 自行实现。
