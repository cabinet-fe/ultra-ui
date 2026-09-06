---
title: "UDialog - 对话框"
description: "用 v-model 或 trigger 插槽打开对话框，footer 插槽可拿到 close"
---

# UDialog - 对话框

## 引入

```ts
import { UDialog } from '@veltra/desktop'
```

## 示例

`UDialog` 用 `v-model` 控制显隐，也可用 `#trigger` 插槽点击打开。遮罩默认开启（`modal`）。`#footer` 作用域提供 `close`；默认插槽可拿到 `maximized`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-button @click="visible = true">打开</u-button>

  <u-dialog v-model="visible" title="提示" style="width: 480px">
    <p>对话框内容</p>
    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>
```

用 `#trigger` 打开，无需外部 `v-model`：

```vue
<template>
  <u-dialog title="消息" :modal="false" @closed="() => {}">
    <template #trigger>
      <u-button>打开对话框</u-button>
    </template>
    <p>非模态对话框不显示遮罩</p>
  </u-dialog>
</template>
```

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 对话框过渡动画名称 */
export type DialogTransition = 'fade-scale'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏 */
  modelValue?: boolean
  /** 弹框标题，header的别名 */
  title?: string
  /** 弹框头部内容，别名是header */
  header?: string
  /** 大小尺寸 */
  size?: ComponentSize
  /** 显示模态层 */
  modal?: boolean
  /** 全屏 */
  fullscreen?: boolean
  /** 弹框过渡动画，默认为 spring */
  transition?: DialogTransition
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

/** 对话框组件暴露的属性和方法(组件内部使用) */
export interface _DialogExposed {
  /** 关闭对话框 */
  close: () => void
}

/** 对话框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DialogExposed = DeconstructValue<_DialogExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
