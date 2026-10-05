---
title: 'UProgress 进度条（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的进度条组件：percentage 驱动，circle 切换条形/环形两种形态，type 支持五种语义色或按百分比返回颜色的函数（移动端必传），默认插槽自定义进度文案；条形与环形轨道色均走主题 token。'
aliases: [UProgress, Progress, 进度条, 环形进度条, 进度环, 圆环进度, 移动端进度]
keywords:
  [
    percentage,
    circle,
    size,
    type,
    ColorType,
    ProgressProps,
    环形进度,
    动态着色,
    百分比,
    上传进度,
    文件上传,
    完成度,
    电池电量,
    内存占用
  ]
---

# UProgress 进度条（@veltra/mobile 移动端）

`@veltra/mobile` 导出进度条组件 `UProgress`：`percentage` 驱动进度，`circle` 切换条形与环形两种形态，`type` 接受五种语义色或按百分比返回颜色的函数，默认插槽可替换进度文案。

## 快速上手

```vue
<script setup lang="ts">
import { UProgress } from '@veltra/mobile'
import '@veltra/mobile/components/progress/style'
</script>

<template>
  <u-progress type="primary" :percentage="60" />
  <!-- => 蓝色（primary）条形进度条，填充宽度 60%，条内居中显示「60%」 -->
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、进度条无颜色。组件样式按需引入：`import '@veltra/mobile/components/progress/style'`。

## API 签名

```ts
import type { ColorType } from '@veltra/utils'

/** progress 组件属性 */
export interface ProgressProps {
  /**
   * 样式类型；移动端无默认值，必传。
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

/** progress 组件定义的事件（空） */
export interface ProgressEmits {}
```

`ColorType` 是 `'primary' | 'info' | 'success' | 'warning' | 'danger'`，从 `@veltra/utils` 导入；`@veltra/mobile` 未再导出该类型。环形实现：SVG `viewBox="0 0 100 100"`、半径 44、线宽 8，进度从 12 点钟方向顺时针展开，`percentage > 0` 时端点圆头。

## 参数说明

| 参数         | 类型                                               | 默认                | 必填 | 约束                                                                                                |
| ------------ | -------------------------------------------------- | ------------------- | :--: | --------------------------------------------------------------------------------------------------- |
| `type`       | `ColorType \| ((percentage: number) => ColorType)` | —                   |  是  | 枚举 `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'`；函数入参是夹紧到 0~100 后的百分比 |
| `percentage` | `number`                                           | `0`                 |  否  | 自动夹紧到 0~100：小于 0 按 0 渲染，大于 100 按 100 渲染                                            |
| `circle`     | `boolean`                                          | `false`             |  否  | `false` 渲染条形，`true` 渲染环形                                                                   |
| `size`       | `number \| string`                                 | `100`（token 兜底） |  否  | 仅 `circle: true` 时生效；`number` 追加 `px`，字符串原样使用；不传时环形直径取 `--um-progress-circle` 密度 token（默认 100px）      |

插槽：默认插槽，作用域 `{ percentage: number; type: ColorType }`。条形模式下插槽内容渲染在填充条内部（文字颜色为白色），环形模式下渲染在圆心；不传插槽时显示 `{{ percentage }}%`。

## 典型示例

### 按百分比动态着色

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UProgress } from '@veltra/mobile'
import type { ColorType } from '@veltra/utils'
import '@veltra/mobile/components/progress/style'

const percentage = ref(85)

// type 接收函数：入参是夹紧到 0~100 后的百分比
function statusType(p: number): ColorType {
  if (p >= 90) return 'danger'
  if (p >= 70) return 'warning'
  return 'success'
}
</script>

<template>
  <u-progress :percentage="percentage" :type="statusType" />
  <!-- => 85 时填充色为 warning 橙 -->
</template>
```

### 环形进度与自定义文案

```vue
<script setup lang="ts">
import { UProgress } from '@veltra/mobile'
import '@veltra/mobile/components/progress/style'
</script>

<template>
  <u-progress type="primary" :percentage="75" circle :size="120">
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
import { UProgress } from '@veltra/mobile'
import '@veltra/mobile/components/progress/style'

const percentage = ref(0)
const timer = setInterval(() => {
  // 超过 100 会被组件夹紧，这里主动停在 100
  percentage.value = Math.min(percentage.value + 10, 100)
  if (percentage.value >= 100) clearInterval(timer)
}, 500)

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <u-progress type="primary" :percentage="percentage" />
  <!-- => 每 500ms 前进 10%，100 时停止并显示「100%」 -->
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端 `type` 必传且无默认值（桌面端默认 `'primary'`）；不传时组件拿不到颜色修饰类，进度条无颜色且插槽作用域的 `type` 为 `undefined`。
> - 本库的百分比参数是 `percentage`，不是 Ant Design Progress 的 `percent`；文字始终渲染在填充条 / 圆心内，无外部文案模式。
> - `percentage` 会被夹紧到 0~100：传入 `150` 按 `100` 渲染，传入 `-10` 按 `0` 渲染；`type` 函数收到的同样是夹紧后的值。
> - 移动端轨道色走主题 token：条形轨道与环形轨道底色均为 `--u-bg-color-hover`，五种语义色的填充 / 环线也由 token 类上色，暗色主题自动切换；桌面端环形轨道是写死的 `#f5f8fa`，不随主题变化——跨端视觉以移动端 token 行为为准。
> - 条形进度条高度为 `1.4em`（桌面端 `1.3em`），基准字号取 `--um-font-size-secondary` 辅助字号档（14px）；宽度占满父容器（块级元素），`size` 对条形无效。
> - `ColorType` 从 `@veltra/utils` 导入，`@veltra/mobile` 未再导出该类型；写 `import type { ColorType } from '@veltra/mobile'` 会得到 `undefined` 类型导入报错。
> - 移动端按需样式路径是 `@veltra/mobile/components/progress/style`，不是 `@veltra/desktop/components/progress/style`。

## 常见问题

### 进度条没有颜色（透明）

两种原因，分别修复：

原因一：应用入口未初始化主题，`--u-color-*` token 为空：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

原因二：移动端 `type` 未传（无默认值）：

```vue
<script setup lang="ts">
import { UProgress } from '@veltra/mobile'
import '@veltra/mobile/components/progress/style'
</script>

<template>
  <u-progress type="primary" :percentage="60" />
</template>
```

### 传入 `percentage` 大于 100 却没有超出

行为如此：`percentage` 自动夹紧到 0~100，超出部分不渲染。需要超量程展示时在业务侧自行换算后再传入。
