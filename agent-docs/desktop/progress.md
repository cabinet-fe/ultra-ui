---
title: UProgress 进度条
description: 从 @veltra/desktop 导出的进度条组件，percentage 驱动，circle 切换条形/环形两种形态，type 支持五种语义色或按百分比返回颜色的函数，默认插槽可自定义进度文案。
aliases:
  - Progress
  - progress
  - 环形进度条
  - 进度环
  - 圆环进度
keywords:
  - percentage
  - circle
  - size
  - type
  - ColorType
  - ProgressProps
  - 环形进度
  - 动态着色
  - 百分比
  - 上传进度
  - 文件上传
  - 完成度
---

# UProgress 进度条

`@veltra/desktop` 导出进度条组件 `UProgress`：`percentage` 驱动进度，`circle` 切换条形与环形两种形态，`type` 接受五种语义色或按百分比返回颜色的函数，默认插槽可替换进度文案。

## 快速上手

```vue
<script setup lang="ts">
import { UProgress } from '@veltra/desktop'
</script>

<template>
  <u-progress :percentage="60" />
  <!-- => 蓝色（primary）条形进度条，填充宽度 60%，条内居中显示「60%」 -->
</template>
```

## API 签名

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** progress 组件属性 */
export interface ProgressProps {
  /**
   * 样式类型。默认 'primary'
   * 传函数时按当前百分比返回类型，入参为夹紧到 0~100 之后的值
   */
  type: ColorType | ((percentage: number) => ColorType)
  /** 环形进度条尺寸：number 追加 px，字符串原样使用；仅 circle 为 true 时生效 */
  size?: number | string
  /** 进度百分比，自动夹紧到 0~100。默认 0 */
  percentage?: number
  /** 是否环形进度条。默认 false */
  circle?: boolean
}

/** progress 组件定义的事件：无 */
export interface ProgressEmits {}

/** progress 组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _ProgressExposed {}
export type ProgressExposed = DeconstructValue<_ProgressExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `type` | `ColorType \| ((percentage: number) => ColorType)` | `'primary'` | 否 | 枚举 `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'`；函数入参是夹紧到 0~100 后的百分比 |
| `percentage` | `number` | `0` | 否 | 自动夹紧到 0~100：小于 0 按 0 渲染，大于 100 按 100 渲染 |
| `circle` | `boolean` | `false` | 否 | `false` 渲染条形，`true` 渲染环形 |
| `size` | `number \| string` | `100`（CSS 固定值） | 否 | 仅 `circle: true` 时生效；`number` 追加 `px`，字符串原样使用 |

插槽：默认插槽，作用域 `{ percentage: number; type: ColorType }`。条形模式下插槽内容渲染在填充条内部（文字颜色为白色），环形模式下渲染在圆心；不传插槽时显示 `{{ percentage }}%`。

## 典型示例

### 按百分比动态着色

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UProgress } from '@veltra/desktop'
import type { ColorType } from '@veltra/desktop'

const percentage = ref(85)

// type 接收函数：入参是夹紧到 0~100 后的百分比
function statusType(p: number): ColorType {
  if (p >= 80) return 'danger'
  if (p >= 50) return 'warning'
  return 'primary'
}
</script>

<template>
  <u-progress :percentage="percentage" :type="statusType" />
  <!-- => 85 时填充色为 danger 红 -->
</template>
```

### 环形进度与自定义文案

```vue
<script setup lang="ts">
import { UProgress } from '@veltra/desktop'
</script>

<template>
  <u-progress :percentage="75" circle :size="120">
    <template #default="{ percentage, type }">
      <span :style="{ color: `var(--u-color-${type})`, fontWeight: 600 }">
        {{ percentage >= 100 ? '完成' : `${percentage}%` }}
      </span>
    </template>
  </u-progress>
</template>
```

### 定时推进的任务进度

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { UProgress } from '@veltra/desktop'

const percentage = ref(0)
const timer = setInterval(() => {
  // 超过 100 会被组件夹紧，这里主动停在 100
  percentage.value = Math.min(percentage.value + 10, 100)
  if (percentage.value >= 100) clearInterval(timer)
}, 500)

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <u-progress :percentage="percentage" />
  <!-- => 每 500ms 前进 10%，100 时停止并显示「100%」 -->
</template>
```

## 注意事项

> [!WARNING]
> - 本库的百分比参数是 `percentage`，不是 Ant Design Progress 的 `percent`，也不是 Element Plus 的 `textInside` 布局参数——文字始终渲染在填充条/圆心内，无外部文案模式。
> - `percentage` 会被夹紧到 0~100：传入 `150` 按 `100` 渲染，传入 `-10` 按 `0` 渲染；`type` 函数收到的同样是夹紧后的值。
> - 环形的轨道颜色是固定值 `#f5f8fa`，不随主题 token 变化；深色背景下必须用默认插槽自定义内容或在业务样式里覆盖。
> - 视觉依赖 `--u-*` 主题 token。独立页面必须在入口执行 `import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 并调用 `loadTheme()`，否则填充色为空。
> - 条形进度条高度固定 `1.3em`，宽度占满父容器（块级元素）；`size` 对条形无效。

## 常见问题

### 进度条没有颜色（透明）

原因：应用入口未初始化主题，`--u-color-*` token 为空。修复：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

### 传入 `percentage` 大于 100 却没有超出

行为如此：`percentage` 自动夹紧到 0~100，超出部分不渲染。需要超量程展示时在业务侧自行换算后再传入。
