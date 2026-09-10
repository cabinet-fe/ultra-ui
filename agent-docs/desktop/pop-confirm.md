---
title: UPopConfirm 气泡确认
description: "从 @veltra/desktop 导入的气泡确认框：点击或悬浮触发元素弹出带图标的确认文案与确认/取消按钮，回调后自动关闭，用于删除等危险操作的二次确认。"
aliases: [PopConfirm, 气泡确认框, 确认框, Popconfirm, 二次确认]
keywords: [confirm, cancel, confirmText, cancelText, iconColor, direction, alignment, trigger, reference, PopConfirmEmits, 二次确认, 删除确认, 危险操作, 危险操作确认, 气泡弹窗, 悬浮确认]
---

# UPopConfirm 气泡确认

`@veltra/desktop` 导出的 `UPopConfirm` 是气泡确认框组件：基于 `UTip`，`#reference` 插槽放触发元素，点击（默认）或悬浮弹出带图标的确认文案与「确认/取消」按钮，点击任一按钮后触发对应事件并自动关闭。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, UPopConfirm } from '@veltra/desktop'

function onDelete() {
  console.log('已确认删除')
}
</script>

<template>
  <UPopConfirm title="确定要删除这条记录吗？" @confirm="onDelete">
    <template #reference>
      <UButton type="danger">删除</UButton>
    </template>
  </UPopConfirm>
</template>
```

## API 签名

```ts
import type { Component } from 'vue'

/** 气泡确认框组件属性（继承自 TipProps 的四个字段已展开） */
export interface PopConfirmProps {
  /** 触发方式。默认 'click' */
  trigger?: 'hover' | 'click'
  /** 弹出方向。默认 'bottom' */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式。默认 'center' */
  alignment?: 'center' | 'start' | 'end'
  /** 气泡内容容器标签。默认 'div' */
  contentTag?: string
  /** 确认文案 */
  title?: string
  /** 图标组件。默认 QuestionFilled（@veltra/icons/normal） */
  icon?: Component
  /** 图标颜色。默认 '#ffc107' */
  iconColor?: string
  /** 确认按钮文字。默认 '确认' */
  confirmText?: string
  /** 取消按钮文字。默认 '取消' */
  cancelText?: string
}

/** 气泡确认框组件定义的事件 */
export interface PopConfirmEmits {
  /** 点击确认按钮后触发；随后气泡自动关闭 */
  (event: 'confirm'): void
  /** 点击取消按钮后触发；随后气泡自动关闭 */
  (event: 'cancel'): void
}

/** 组件 ref 暴露（DeconstructValue 解包后的形态）。当前为空对象：UPopConfirm 没有暴露方法 */
export interface PopConfirmExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `title` | `string` | — | 否 | 确认文案，纯文本渲染；要换行/富文本时本组件不支持，改用 UTip 自定义内容 |
| `icon` | `Component` | `QuestionFilled` | 否 | 文案左侧图标，尺寸固定 16px |
| `iconColor` | `string` | `'#ffc107'` | 否 | 图标颜色，写入内联 `color` |
| `confirmText` | `string` | `'确认'` | 否 | 确认按钮文字（primary 实心小按钮） |
| `cancelText` | `string` | `'取消'` | 否 | 取消按钮文字（text 小按钮） |
| `trigger` | `'hover' \| 'click'` | `'click'` | 否 | `click` 时点击外部也关闭；`hover` 时移出触发元素/气泡关闭 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | 否 | 气泡相对触发元素的弹出方向 |
| `alignment` | `'center' \| 'start' \| 'end'` | `'center'` | 否 | 气泡沿弹出方向的对齐方式 |
| `contentTag` | `string` | `'div'` | 否 | 气泡内容容器标签名 |

## 方法与事件

| 名称 | 类型 | 触发时机 |
| --- | --- | --- |
| `confirm` | `()` | 点击确认按钮后触发；事件发出后气泡立即关闭 |
| `cancel` | `()` | 点击取消按钮后触发；事件发出后气泡立即关闭 |

气泡显隐由组件内部管理（内部 `visible` 初始 `false`）：没有 `visible` prop，也没有 `v-model`，外部无法编程式打开或关闭；打开只能通过触发元素的点击/悬浮，关闭只能通过确认、取消按钮或点击外部（`trigger='click'` 时）。

`UPopConfirm` 没有暴露任何 ref 方法（`PopConfirmExposed` 为空对象）。

## 典型示例

### 删除二次确认 + 取消回调

```vue
<script setup lang="ts">
import { UButton, UPopConfirm } from '@veltra/desktop'

function handleConfirm() {
  console.log('已删除')
}

function handleCancel() {
  console.log('已取消')
}
</script>

<template>
  <UPopConfirm
    title="删除后不可恢复，确认删除？"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #reference>
      <UButton type="danger">删除</UButton>
    </template>
  </UPopConfirm>
</template>
```

### 自定义文字、图标与方向

```vue
<script setup lang="ts">
import { UButton, UPopConfirm } from '@veltra/desktop'
import { WarningFilled } from '@veltra/icons/normal'

function handleSubmit() {
  console.log('已提交')
}
</script>

<template>
  <UPopConfirm
    title="提交后不可撤回，确认提交？"
    confirm-text="提交"
    cancel-text="再想想"
    direction="top"
    :icon="WarningFilled"
    icon-color="#e84235"
    @confirm="handleSubmit"
  >
    <template #reference>
      <UButton type="primary">提交</UButton>
    </template>
  </UPopConfirm>
</template>
```

### hover 触发 + 对齐方式

```vue
<script setup lang="ts">
import { UButton, UPopConfirm } from '@veltra/desktop'
import { Delete } from '@veltra/icons/normal'

function handleDelete() {
  console.log('已确认删除')
}
</script>

<template>
  <UPopConfirm
    title="确定移除该项？"
    trigger="hover"
    alignment="start"
    @confirm="handleDelete"
  >
    <template #reference>
      <UButton text type="danger" :icon="Delete">移除</UButton>
    </template>
  </UPopConfirm>
</template>
```

## 注意事项

> [!WARNING]
> - 气泡显隐不可控：没有 `visible` prop、没有 `v-model`，显隐完全由触发交互与内部状态管理；需要编程式确认弹窗时用 `messageConfirm`（函数式确认框），需要自定义内容的浮层用 `UTip`。
> - 触发元素必须写在 `#reference` 插槽，不是默认插槽。
> - `trigger='click'` 时点击气泡外部关闭；`trigger='hover'` 时移出触发元素或气泡关闭，没有点击外部关闭。
> - 点击确认或取消按钮后气泡一定关闭；要在确认回调里做异步校验后再关闭的需求无法实现（关闭先于异步完成），此类场景用 `UDialog` + footer 按钮。
> - 本组件的尺寸跟随所在 `UForm` 的 `size`（表单上下文），不在表单内时为 `'default'`；没有独立 `size` prop。
> - `title` 是纯文本；图标尺寸固定 16px，颜色用 `iconColor` 覆盖。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 点击触发元素没有弹出

`#reference` 插槽内必须有一个可接收点击的真实元素（如 `UButton`）；插槽为空或只有纯文本节点时没有可绑定事件的宿主。修复：

```vue
<UPopConfirm title="确认吗？" @confirm="onConfirm">
  <template #reference>
    <UButton>删除</UButton>
  </template>
</UPopConfirm>
```
