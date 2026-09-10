---
title: UButton / UButtonGroup 按钮
description: "@veltra/desktop 导出的按钮组件。UButton 提供五种语义色（primary/info/success/warning/danger）、三档尺寸、plain/text/circle 形态、loading 与 disabled 状态、图标按钮；UButtonGroup 通过插槽作用域把按钮 props 统一透传给一组按钮。"
aliases: [UButton, UButtonGroup, Button, ButtonGroup, 按钮, 按钮组]
keywords: [UButton, UButtonGroup, ButtonProps, ButtonType, ButtonExposed, propagate, iconPosition, loadingIcon, circle, plain, 点击事件, 阻止冒泡, 图标按钮, 加载状态, 禁用按钮, 按钮组, 统一透传, 语义色按钮]
---

# UButton / UButtonGroup 按钮

`@veltra/desktop` 导出 `UButton` 与 `UButtonGroup`。`UButton` 渲染原生 `<button type="button">`，用 `type` 指定五种语义色，`size` 指定三档尺寸，`plain` / `text` / `circle` 切换形态，`loading` / `disabled` 控制状态，`icon` 传图标组件；`UButtonGroup` 是按钮组容器，通过默认插槽作用域把组上声明的 `ButtonProps` 统一透传给每个子按钮。

## 快速上手

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'

function onSave() {
  console.log('saved') // => 点击按钮时输出 'saved'
}
</script>

<template>
  <u-button type="primary" @click="onSave">保存</u-button>
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、按钮无颜色。

## API 签名

```ts
import type { Component } from 'vue'

/** 五种语义色 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 按钮类型 = 语义色 */
export type ButtonType = ColorType

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 按钮属性类型 */
export interface ButtonProps extends ComponentProps {
  /** 组件尺寸，默认 'default' */
  size?: ComponentSize
  /** 按钮语义色，不传时为无语义的默认灰样式 */
  type?: ButtonType
  /** 是否以文本形式展示（无边框底色） */
  text?: boolean
  /** 朴素模式（描边浅底） */
  plain?: boolean
  /** 加载中，为 true 时不触发 click */
  loading?: boolean
  /** 加载图标，默认 Loading（@veltra/icons） */
  loadingIcon?: Component
  /** 圆形，宽度等于高度；只放图标时使用 */
  circle?: boolean
  /** 禁用，默认 false；为 true 时不触发 click */
  disabled?: boolean
  /** 图标组件，传 @veltra/icons/normal 中的图标 */
  icon?: Component
  /** 图标大小，单位 px */
  iconSize?: number
  /** 图标位置，默认 'left' */
  iconPosition?: 'left' | 'right'
  /** 点击事件是否向父元素冒泡，默认 true */
  propagate?: boolean
}

export interface ButtonEmits {
  /** 点击事件 */
  (name: 'click', e: MouseEvent): void
}

/** 按钮暴露的属性和方法（原 `_ButtonExposed` 经 DeconstructValue 解包后的形态：模板 ref 上直接读 el，不需要 .value） */
export interface ButtonExposed {
  el: HTMLButtonElement | undefined
}
```

`DeconstructValue` 已在类型入口展开：模板 ref 上 `instance.el` 直接是 `HTMLButtonElement | undefined`，不需要再 `.value`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `type` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | — | 否 | 枚举仅这五个值；不传时渲染无语义色的默认灰底按钮 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 三档尺寸，控制高度、字号、圆角 |
| `text` | `boolean` | `false` | 否 | 文本按钮；为 true 时无水波纹 |
| `plain` | `boolean` | `false` | 否 | 朴素描边模式；与 `type` 同用时点击水波纹使用对应语义色 |
| `circle` | `boolean` | `false` | 否 | 圆形；宽度等于高度，只放图标时使用 |
| `loading` | `boolean` | `false` | 否 | 显示加载图标（替换左侧图标）并屏蔽 click |
| `loadingIcon` | `Component` | `Loading` | 否 | 加载图标组件，从 `@veltra/icons` 导入 |
| `disabled` | `boolean` | `false` | 否 | 禁用；屏蔽 click 且无水波纹 |
| `icon` | `Component` | — | 否 | 图标组件；`loading` 为 true 时左侧图标被加载图标替换 |
| `iconSize` | `number` | — | 否 | 图标边长，单位 px |
| `iconPosition` | `'left' \| 'right'` | `'left'` | 否 | `right` 时图标在文字之后 |
| `propagate` | `boolean` | `true` | 否 | `false` 时点击调用 `stopPropagation()`，事件不再冒泡到父元素 |

## 方法与事件

| 事件 / 暴露 | 签名 | 说明 |
| --- | --- | --- |
| `click` | `(e: MouseEvent) => void` | 同步触发；`disabled` 或 `loading` 为 true 时不 emit 且阻止冒泡；`propagate: false` 时先 `stopPropagation()` 再 emit |
| `el`（exposed） | `HTMLButtonElement \| undefined` | 经模板 ref 访问，如 `btnRef.value?.el`；组件挂载前为 `undefined` |

## 典型示例

### 语义色与形态组合

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'
</script>

<template>
  <u-button>默认</u-button>
  <u-button type="primary">主要</u-button>
  <u-button type="success">成功</u-button>
  <u-button type="warning">警告</u-button>
  <u-button type="danger">危险</u-button>
  <u-button type="info">信息</u-button>

  <u-button type="primary" size="small">小</u-button>
  <u-button type="primary" size="large">大</u-button>

  <u-button type="primary" plain>朴素</u-button>
  <u-button type="danger" text>文本按钮</u-button>
  <u-button type="primary" disabled>禁用</u-button>
</template>
```

### 图标按钮与加载状态

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton } from '@veltra/desktop'
import { Edit, Refresh, Search } from '@veltra/icons/normal'

const saving = ref(false)

function onSave() {
  saving.value = true
  setTimeout(() => {
    saving.value = false // 模拟请求结束后关闭加载态
  }, 1000)
}
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" :icon="Search" icon-position="right" :icon-size="16">搜索</u-button>
  <u-button type="primary" circle :icon="Edit" aria-label="编辑" />
  <u-button type="primary" :loading="saving" @click="onSave">保存</u-button>
  <u-button type="primary" loading :loading-icon="Refresh">自定义加载图标</u-button>
</template>
```

### UButtonGroup 统一透传 props

组上声明 `size` / `disabled` 等 `ButtonProps`，子按钮用 `v-bind="props"` 接收，再写自己的属性覆盖：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UButton, UButtonGroup } from '@veltra/desktop'
import { bem } from '@veltra/utils'

const buttons = [
  { text: '剪切' },
  { text: '复制' },
  { text: '粘贴' }
]
const active = shallowRef(0)
</script>

<template>
  <u-button-group v-slot="{ props }" size="small" type="primary">
    <u-button
      v-for="(btn, i) in buttons"
      :key="i"
      v-bind="props"
      :class="bem.is('active', i === active)"
      @click="active = i"
    >
      {{ btn.text }}
    </u-button>
  </u-button-group>
</template>
```

## 注意事项

> [!WARNING]
> - 本库原生按钮的 `type` 固定为 `"button"`，没有 `native-type` 属性；需要表单提交按钮时禁止期待 `native-type="submit"`，自行监听 click 后调用提交逻辑。
> - 组件不注入默认 `aria-label`：按钮的可访问名来自默认插槽文本，或你自己传的 `aria-label`（透传到根元素）。只有图标的按钮（`circle` + `icon`、无文字）必须自行传 `aria-label`，否则屏幕阅读器与 `getByRole('button', { name })` 都读不出名字。
> - 本库图标是 prop（`icon` 传组件），不是 `<template #icon>` 插槽；默认插槽只承载文字内容。
> - `type` 的五个枚举值是语义色，没有 `'default'`、`'text'` 这类取值；无色按钮是「不传 `type`」，文本按钮是「传 `text`」。
> - `disabled` / `loading` 时组件不 emit `click`，父级 `@click` 也不会收到。
> - 点击默认冒泡到父元素；在弹层、表格行内做按钮时若不希望触发行点击，设 `:propagate="false"`。
> - `UButtonGroup` 不是选择器组件：它只透传 props，选中态（如 `bem.is('active', ...)` 的 class）由业务自己维护。
> - 暴露的 `el` 是解包后的形态，直接读 `btnRef.value?.el`，禁止再写 `.el.value`。

## 常见问题

### 点击按钮没有任何反应

按顺序排查：`disabled` 或 `loading` 是否为 true（此时组件直接吞掉点击）；事件是否绑在 `@click` 上（本库事件名是 `click`）：

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'

function onClick() {
  console.log('clicked') // => 'clicked'
}
</script>

<template>
  <u-button type="primary" @click="onClick">可点击</u-button>
</template>
```

### 点击按钮时外层容器的 click 也被触发了

原因：`propagate` 默认 `true`。修复：给按钮设 `:propagate="false"`，或在外层用 `@click.stop` 自行拦截。

### `getByRole('button', { name: '保存' })` / 屏幕阅读器读不出按钮名

按钮的可访问名只来自两处：默认插槽文本、或你传入的 `aria-label`。纯图标按钮（没写文字、也没传 `aria-label`）读出来是空名字；修复方式是显式命名：

```vue
<script setup lang="ts">
import { Edit } from '@veltra/icons/normal'
</script>

<template>
  <!-- 有文字：可访问名即「保存」 -->
  <u-button type="primary">保存</u-button>

  <!-- 只有图标：必须自己传 aria-label -->
  <u-button circle :icon="Edit" aria-label="编辑" />
</template>
```
