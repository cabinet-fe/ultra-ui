---
title: UDialog 对话框（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端模态对话框：以居中卡片呈现，v-model 或 trigger 插槽控制显隐，带遮罩、标题栏与 footer 按钮区；fullscreen 切换全屏形态，内容超出卡片高度（86vh）时在内容区自动滚动。API 与 @veltra/desktop 的 UDialog 同名，交互为移动端形态：无拖拽、无最大化按钮、无 Esc 关闭。'
aliases: [Dialog, Modal, 弹窗, 模态框, 移动端对话框]
keywords:
  [
    modelValue,
    update:modelValue,
    closed,
    fullscreen,
    fade-scale,
    DialogExposed,
    header,
    footer,
    trigger,
    modal,
    ComponentSize,
    居中卡片,
    全屏,
    遮罩,
    点击遮罩关闭,
    内容滚动,
    表单弹窗,
    z-index,
    移动端弹窗
  ]
---

# UDialog 对话框（@veltra/mobile 移动端）

`@veltra/mobile` 导出的 `UDialog` 是移动端模态对话框组件：以**居中卡片**呈现，用 `v-model`（`modelValue`）或 `#trigger` 插槽控制显隐，内容通过 Teleport 渲染在 `body` 下，带遮罩、标题栏与 `footer` 按钮区插槽；`fullscreen` 开启全屏形态。

卡片**自带内容滚动**：整体高度上限 `86vh`（`86dvh`），内容超出时在内容区（`.um-dialog__body`）自动滚动，标题栏与 footer 吸顶/吸底。因此**不要**在内容里再写 `height` / `max-height` / `overflow: auto`，也不要自己包滚动容器。卡片宽度由组件按 `size` 控制（`max-width`），不需要外部设置宽度。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开</UButton>

  <UDialog v-model="visible" title="提示">
    <p>这是对话框内容</p>

    <template #footer="{ close }">
      <UButton @click="close()">取消</UButton>
      <UButton type="primary" @click="close()">确认</UButton>
    </template>
  </UDialog>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/dialog/style`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
export type ComponentSize = 'small' | 'default' | 'large'

/** 对话框过渡动画名称 */
export type DialogTransition = 'fade-scale'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏。默认 false */
  modelValue?: boolean
  /** 弹框标题，header 的别名 */
  title?: string
  /** 弹框头部内容，优先于 title */
  header?: string
  /** 大小尺寸，决定卡片最大宽度与字号。默认 'default' */
  size?: ComponentSize
  /** 显示模态遮罩。默认 true */
  modal?: boolean
  /** 全屏：卡片铺满视口、去圆角。默认 false */
  fullscreen?: boolean
  /** 弹框过渡动画。默认 'fade-scale'，当前仅此一个取值 */
  transition?: DialogTransition
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 遮罩淡出动画完全结束后触发 */
  (e: 'closed'): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态，
 * 通过 const dialogRef = ref<DialogExposed>() 访问）
 */
export interface DialogExposed {
  /** 关闭对话框，等价于把 modelValue 置为 false。同步，无返回值 */
  close: () => void
}
```

## 参数说明

| 参数         | 类型                              | 默认           | 必填 | 约束                                                                                     |
| ------------ | --------------------------------- | -------------- | :--: | ---------------------------------------------------------------------------------------- |
| `modelValue` | `boolean`                         | `false`        |  否  | 用 `v-model` 绑定；`false` 时整棵弹框 DOM 不渲染                                         |
| `title`      | `string`                          | —              |  否  | 标题文字；`header` 存在时被忽略                                                          |
| `header`     | `string`                          | —              |  否  | 标题文字，优先于 `title`；要自定义结构时改用 `#header` 插槽                              |
| `size`       | `'small' \| 'default' \| 'large'` | `'default'`    |  否  | 决定卡片最大宽度：`small` 320px、`default` 420px、`large` 560px，并影响标题字号          |
| `modal`      | `boolean`                         | `true`         |  否  | `true` 时显示遮罩且点遮罩关闭；`false` 时无遮罩背景且遮罩层 `pointer-events: none`，点击外部不关闭 |
| `fullscreen` | `boolean`                         | `false`        |  否  | `true` 时卡片 `width` / `height` 100%、去 `max-width` / `max-height` 与圆角，铺满视口   |
| `transition` | `'fade-scale'`                    | `'fade-scale'` |  否  | 当前仅接受 `'fade-scale'`                                                               |

## 方法与事件

| 名称                | 类型                         | 触发时机                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `update:modelValue` | `(visible: boolean) => void` | 点遮罩（`modal: true` 时）、点右上角关闭按钮或调用 `close()` 时发出，配合 `v-model` 同步外部状态 |
| `closed`            | `()`                         | 遮罩淡出过渡 `after-leave` 后触发一次，此时 DOM 已卸载，适合清理表单状态       |
| `close`（ref 方法） | `() => void`，同步，无返回值 | 主动关闭，内部把 `modelValue` 置 `false`                                       |

插槽作用域：

- `#default`：无作用域；内容渲染在组件内容区（`.um-dialog__body`），高度上限 `86vh`（全屏时无上限），超出自动滚动。内容里禁止再写 `height`、`max-height`、`overflow` 或自建滚动容器。
- `#footer="{ close }"`：`close: () => void`，等价于 ref 上的 `close()`；仅传入该插槽时才渲染 footer 分隔区。
- `#header`：无作用域；替换标题文字区域，标题栏与右上角关闭按钮保留。
- `#trigger`：无作用域；渲染在遮罩之外，点击触发元素在打开 / 关闭间切换。

标题栏始终渲染（含右上角关闭按钮，触控热区不小于 44x44）；标题文字单行省略。

## 典型示例

### 表单对话框：footer 校验通过后再关闭

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'

import { UButton, UDialog, UForm, UInput } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
const formRef = useTemplateRef<{ validate: () => Promise<boolean> }>('form')
const formData = reactive({ name: '' })

async function handleConfirm(close: () => void) {
  const valid = await formRef.value?.validate()
  if (valid) {
    console.log(formData.name) // => 输入的名称
    close()
  }
}
</script>

<template>
  <UButton @click="visible = true">新建</UButton>

  <UDialog v-model="visible" title="新建">
    <UForm ref="form" :model="formData">
      <UInput label="名称" field="name" :rules="{ required: true }" />
    </UForm>

    <template #footer="{ close }">
      <UButton @click="close()">取消</UButton>
      <UButton type="primary" @click="handleConfirm(close)">确认</UButton>
    </template>
  </UDialog>
</template>
```

### 全屏形态与长内容滚动

`fullscreen` 铺满视口；非全屏时卡片高度上限 `86vh`，内容超出在内容区自动滚动，标题栏与 footer 不动。只写内容需要的样式，**不要**再给内容加 `height` / `max-height` / `overflow: auto`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const fullscreenVisible = ref(false)
const longVisible = ref(false)
const rows = Array.from({ length: 30 }, (_, i) => `第 ${i + 1} 行内容`)
</script>

<template>
  <UButton type="primary" @click="fullscreenVisible = true">全屏对话框</UButton>
  <UButton @click="longVisible = true">查看长内容</UButton>

  <!-- 全屏：卡片铺满视口、去圆角，内容超高时在内容区滚动 -->
  <UDialog v-model="fullscreenVisible" fullscreen title="全屏">
    <p v-for="row in rows" :key="row">{{ row }}</p>
    <template #footer="{ close }">
      <UButton type="primary" @click="close()">关闭</UButton>
    </template>
  </UDialog>

  <!-- 非全屏：高度上限 86vh，超出自动滚动，无需自写高度与滚动样式 -->
  <UDialog v-model="longVisible" title="条款">
    <p v-for="row in rows" :key="row">{{ row }}</p>
  </UDialog>
</template>
```

### trigger 插槽：免 v-model，监听 closed 清理

```vue
<script setup lang="ts">
import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

function onClosed() {
  // 遮罩淡出动画完全结束后触发，在这里做清理
  console.log('弹框已完全关闭')
}
</script>

<template>
  <UDialog title="消息" @closed="onClosed">
    <template #trigger>
      <UButton>打开对话框</UButton>
    </template>

    <p>点击触发元素打开，再点击一次则关闭</p>
  </UDialog>
</template>
```

非模态弹框把 `modal` 设为 `false`（无遮罩背景、点击外部不关闭，用右上角关闭按钮关闭），与 `fullscreen` 互不影响。

## 注意事项

> [!WARNING]
>
> - 移动端是**居中卡片 + fullscreen 全屏形态**（`fullscreen` 生效：铺满视口、去圆角）；桌面端 `fullscreen` 已声明但无行为，全屏走标题栏最大化按钮。
> - 移动端 `size` 决定**卡片最大宽度**（`small` 320px / `default` 420px / `large` 560px）与字号，无需外部设置宽度；桌面端 `size` 只影响标题栏内边距与字号，宽度必须外部设置。
> - 移动端**无标题栏拖拽、无最大化/还原按钮、无 Esc 关闭**（这些是桌面端行为）；关闭途径仅四种：点遮罩（`modal: true` 时）、点右上角关闭按钮、调用 ref 的 `close()`、点击 `#trigger` 触发元素切换。
> - 移动端内容滚动上限是 `86vh`（`86dvh`）；桌面端是 `90vh`。
> - 移动端 `#default` 插槽**无作用域参数**（桌面端有 `maximized` 参数）；全屏形态由 `fullscreen` prop 声明式控制，不需要作用域参数。
> - 组件**自带内容滚动**：`#default` 内容渲染在内容区，超出高度自动滚动。**禁止**在内容上再写 `height` / `max-height` / `overflow: auto`，也禁止自建滚动容器或全屏定位。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` 或 `visible`。
> - `title` 与 `header` 都是标题文字且 `header` 优先；要自定义标题结构用 `#header` 插槽，而不是传对象。
> - 没有拦截关闭的钩子（没有 `before-close`）：点遮罩、点关闭按钮都会直接关闭；需要校验通过才能关闭的流程，把关闭逻辑放进 footer 自己的回调里控制 `v-model`。
> - 每次关闭后弹框内容即卸载，重新打开会重新挂载；需要保留的表单数据必须放在弹框组件外部。
> - 多个弹框叠加时按打开顺序自动递增 `z-index`，后开的在上层。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 传了 `fullscreen` 但弹框没有变化

确认写的是 `fullscreen` 布尔 prop（`<UDialog fullscreen />` 或 `:fullscreen="true"`）。移动端该属性生效；若在 `@veltra/desktop` 中传入同名属性无效果，那是桌面端声明的未实现属性，两端口径不同。

### 关闭动画期间页面闪烁或状态残留

原因：在 `close` / `update:modelValue` 时机做清理，此刻退场动画尚未结束、DOM 仍在。修复：清理逻辑放到 `@closed`（遮罩淡出过渡完全结束、DOM 已卸载后触发一次）。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

import { UButton, UDialog, UForm, UInput } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
const formData = reactive({ name: '' })

function onClosed() {
  // DOM 已卸载，重置表单不会引发视图闪烁
  formData.name = ''
}
</script>

<template>
  <UButton @click="visible = true">打开</UButton>
  <UDialog v-model="visible" title="新建" @closed="onClosed">
    <UForm :model="formData">
      <UInput label="名称" field="name" />
    </UForm>
  </UDialog>
</template>
```
