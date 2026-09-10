---
title: UBadge 徽标
description: "@veltra/desktop 导出的徽标组件。包裹任意内容后在右上角叠加数字、文本或小圆点，支持超过最大值显示 99+、五种语义色、自定义背景色、hidden 控制显隐，用于消息数、未读数等角标场景。"
aliases: [UBadge, Badge, 徽标, 角标, badge count]
keywords: [UBadge, BadgeProps, value, max, dot, hidden, ColorType, 徽标, 角标, 未读数, 消息数, 超出显示, 小圆点, 自定义背景色, 顶点叠加]
---

# UBadge 徽标

`@veltra/desktop` 导出组件 `UBadge`。默认插槽是被包裹的内容，徽标以 `<sup class="u-badge__sup">` 叠加在内容右上角：`value` 传数字或文本，数字超过 `max`（默认 99）时显示 `99+`，`dot` 只显示小圆点，`hidden` 为 true 时不渲染徽标，`type` 给五种语义色，`color` 自定义背景色。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UBadge, UButton } from '@veltra/desktop'

const count = ref(5)
</script>

<template>
  <u-badge :value="count">
    <u-button>消息</u-button>
  </u-badge>
</template>
```

徽标显示 `5`，叠在按钮右上角。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、徽标无颜色。

## API 签名

```ts
/** 五种语义色 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 徽章组件属性 */
export interface BadgeProps extends ComponentProps {
  /** 组件尺寸，默认 'default' */
  size?: ComponentSize
  /** 显示值，数字或文本 */
  value?: number | string
  /** 类别（语义色） */
  type?: ColorType
  /** 自定义背景色，任意合法 CSS 颜色值 */
  color?: string
  /** 是否隐藏 Badge，默认 false；为 true 时不渲染 sup 元素 */
  hidden?: boolean
  /** 最大值，value 超过时显示 {{max}}+，默认 99 */
  max?: number
  /** 是否显示小圆点，默认 false；为 true 时忽略 value 文案 */
  dot?: boolean
}

/** 徽章组件定义的事件（仅类型声明，当前版本源码不会触发） */
export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

/** 徽章暴露的属性和方法：BadgeExposed 为空接口，模板 ref 上取不到任何方法或属性 */
export type BadgeExposed = {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `value` | `number \| string` | — | 否 | 数字时参与 `max` 截断；字符串原样显示 |
| `type` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | — | 否 | 枚举仅这五个值；设置后徽标变为浅底彩字（`--u-color-<type>` 的 `light-7` 底 + 类型色文字）；不传时为默认红底白字（`--u-color-danger`） |
| `color` | `string` | — | 否 | 任意 CSS 颜色（如 `#ff6b6b`）；以内联 `backgroundColor` 覆盖背景，优先级高于 `type` 的背景 |
| `hidden` | `boolean` | `false` | 否 | `true` 时 `v-if` 移除徽标元素，插槽内容正常显示 |
| `max` | `number` | `99` | 否 | 仅 `value` 为 `number` 时生效；`value > max` 时显示 `` `${max}+` `` |
| `dot` | `boolean` | `false` | 否 | 8×8 圆点；为 true 时徽标内容为空，`value` 不显示 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 控制字号与内边距；`default` 档高 22px，`large` 档高 26px |

## 方法与事件

无暴露方法（`BadgeExposed` 为空）。`update:modelValue` 只存在于类型声明 `BadgeEmits`，当前版本源码没有任何 emit 调用，监听它不会收到回调。

## 典型示例

### 数字徽标与最大值截断

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UBadge, UButton } from '@veltra/desktop'

const unread = ref(120) // => 显示 '99+'（默认 max 99）
const noticed = ref(50)
</script>

<template>
  <u-badge :value="unread">
    <u-button>评论</u-button>
  </u-badge>
  <u-badge :value="noticed" :max="49">
    <u-button>消息</u-button>
  </u-badge>
</template>
```

### 语义色、圆点与自定义颜色

```vue
<script setup lang="ts">
import { UBadge } from '@veltra/desktop'
</script>

<template>
  <u-badge :value="10" type="primary">
    <u-button>通知</u-button>
  </u-badge>
  <u-badge :value="9" color="#ff6b6b">
    <u-button>自定义背景色</u-button>
  </u-badge>
  <u-badge dot type="danger">
    <span>未读消息</span>
  </u-badge>
  <u-badge value="NEW" type="success">
    <u-button>活动</u-button>
  </u-badge>
</template>
```

### 按未读数显隐徽标

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UBadge, UButton } from '@veltra/desktop'

const count = ref(0)
</script>

<template>
  <u-badge :value="count" :hidden="count === 0">
    <u-button>待处理</u-button>
  </u-badge>
  <u-button @click="count = 3">模拟收到 3 条</u-button>
</template>
```

## 注意事项

> [!WARNING]
> - 不传 `type` 时徽标是红底白字（默认即 danger 色），不是灰色；要灰色调请用 `color` 自定义。
> - `type` 与 `color` 的取别：`type` 改变整套配色（浅底彩字），`color` 只改背景色。需要语义色时用 `type`，需要精确品牌色时用 `color`。
> - `color` 在组件挂载时一次性写入内联样式：挂载后再修改 `color` 值不会生效；颜色需要动态切换时用 `:key` 强制重建徽标。
> - `max` 只对数字 `value` 生效；`value` 为字符串时原样显示，禁止依赖 `max` 截断文本。
> - `dot` 为 true 时 `value` 不渲染；要圆点加数字的组合本库不支持。
> - 徽标定位依赖根元素 `position: relative`（`width: max-content`）；给 `<u-badge>` 传 class/style 会落在根 div 上，不要用绝对定位破坏其包裹关系。
> - `update:modelValue` 事件当前版本不会触发，禁止在上面挂业务逻辑。

## 常见问题

### 徽标数字没有变成 `99+`

原因：`max` 截断仅在 `value` 为 `number` 且 `max` 也为 `number` 时生效。检查绑定是否写成了字符串：

```vue
<script setup lang="ts">
import { UBadge } from '@veltra/desktop'

const count = 120
</script>

<template>
  <!-- 正确：绑定数字 -->
  <u-badge :value="count"><u-button>消息</u-button></u-badge>
  <!-- 错误：value="120" 是字符串，显示原文 120 -->
</template>
```

### 徽标被父容器裁剪

原因：徽标以负向 transform 叠出内容右上角，父容器 `overflow: hidden` 会裁掉超出部分。修复：给父容器留出溢出空间或去掉 `overflow: hidden`。
