---
title: UProgressNodes 进度节点
description: 从 @veltra/desktop 导出的水平节点进度组件：nodes 数组驱动节点，check 标记已完成节点，v-model 高亮当前节点，节点超出 maxWidth 时可横向拖拽滚动并显示两端渐隐遮罩。
aliases:
  - ProgressNodes
  - progress-nodes
  - 步骤节点
  - 节点进度
  - 流程节点
keywords:
  - nodes
  - modelValue
  - check
  - labelKey
  - valueKey
  - colorType
  - maxWidth
  - update:modelValue
  - 横向滚动
  - 拖拽滚动
  - 已完成节点
  - 当前节点
  - 审批流
---

# UProgressNodes 进度节点

`@veltra/desktop` 导出节点进度组件 `UProgressNodes`：用 `nodes` 数组渲染一排带虚线连接的圆点节点，`check` 标记已完成节点，`v-model` 高亮当前节点；节点总宽超出 `maxWidth` 时自动进入可拖拽的横向滚动。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UProgressNodes } from '@veltra/desktop'

const current = ref('step-2')
const nodes = [
  { label: '提交', value: 'step-1' },
  { label: '审核', value: 'step-2' },
  { label: '完成', value: 'step-3' }
]
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="nodes" />
  <!-- => 三个节点横向排列，「审核」圆点带灰底高亮；点击节点后 current 更新为该节点 value -->
</template>
```

## API 签名

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 进度节点组件属性 */
export interface ProgressNodesProps {
  /** 当前选中节点的值（与节点 valueKey 字段严格相等才高亮） */
  modelValue?: string | number
  /** 节点列表，必填 */
  nodes: Record<string, any>[]
  /** 返回 true 时该节点标记为已完成（圆点填充 colorType 颜色） */
  check?: (node: Record<string, any>, index: number) => boolean
  /** 高亮颜色类型。默认 'primary' */
  colorType?: ColorType
  /** 容器最大宽度：number 追加 px，字符串原样使用；超出时进入横向滚动 */
  maxWidth?: number | string
  /** 节点标签字段名。默认 'label' */
  labelKey?: string
  /** 节点取值字段名。默认 'value' */
  valueKey?: string
}

/** 进度节点组件事件 */
export interface ProgressNodesEmits {
  /** 点击节点时触发，晚于 update:modelValue */
  (e: 'click', node: Record<string, any>, index: number): void
  /** 点击节点时先触发，payload 为 node[valueKey] 的值 */
  (e: 'update:modelValue', value: string | number): void
}

/** 进度节点组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _ProgressNodesExposed {}
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `nodes` | `Record<string, any>[]` | — | 是 | 每项必须包含 `labelKey`（默认 `label`）与 `valueKey`（默认 `value`）字段；DOM key 取 `node.key`，缺失时回退索引 |
| `modelValue` | `string \| number` | — | 否 | 与 `node[valueKey]` 全等（`===`）的节点显示灰底高亮；配合 `v-model` 使用 |
| `check` | `(node, index) => boolean` | — | 否 | 不传时没有「已完成」节点，仅剩当前节点高亮 |
| `colorType` | `ColorType` | `'primary'` | 否 | 枚举 `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'`，控制已完成节点的圆点与文字颜色 |
| `maxWidth` | `number \| string` | — | 否 | 容器最大宽度；不传时占满父容器，仅在溢出时才可滚动 |
| `labelKey` | `string` | `'label'` | 否 | 空串 / `null` / `undefined` 时回退 `'label'` |
| `valueKey` | `string` | `'value'` | 否 | 空串 / `null` / `undefined` 时回退 `'value'` |

插槽：

- 默认插槽，作用域 `{ node: Record<string, any>; index: number }`，替换节点标签文字。
- `icon` 插槽，作用域 `{ node: Record<string, any>; index: number }`，渲染在节点圆点内部。

## 方法与事件

- `update:modelValue`：点击任意节点时同步触发，payload 为 `node[valueKey]` 的值；这是 `v-model` 的写入事件。
- `click(node, index)`：同一次点击在 `update:modelValue` 之后触发，`node` 是原始节点对象，`index` 是数组下标。点击不校验 `check`，任何节点都可点击。

## 典型示例

### 审批流：已完成 + 当前节点

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UProgressNodes } from '@veltra/desktop'

const current = ref('review')
const nodes = [
  { label: '起草', value: 'draft' },
  { label: '审核', value: 'review' },
  { label: '签发', value: 'sign' },
  { label: '归档', value: 'done' }
]

const doneSet = new Set(['draft'])

function isChecked(node: Record<string, any>) {
  return doneSet.has(node.value)
}
</script>

<template>
  <u-progress-nodes
    v-model="current"
    :nodes="nodes"
    :check="isChecked"
    color-type="success"
  />
  <!-- => 「起草」圆点绿色实心（已完成），「审核」灰底高亮（当前） -->
</template>
```

### 节点过多时横向拖拽滚动

```vue
<script setup lang="ts">
import { UProgressNodes } from '@veltra/desktop'

const nodes = Array.from({ length: 18 }, (_, i) => ({
  value: `node-${i + 1}`,
  label: `节点 ${i + 1}`
}))
</script>

<template>
  <u-progress-nodes :nodes="nodes" max-width="520px" />
  <!-- => 只显示 520px 宽，按住鼠标左右拖拽即可滚动；两端各有 30px 渐隐遮罩 -->
</template>
```

### 自定义圆点图标与标签

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Check } from '@veltra/icons/normal'
import { UProgressNodes } from '@veltra/desktop'

const current = ref('b')
const nodes = [
  { label: '下单', value: 'a' },
  { label: '支付', value: 'b' },
  { label: '发货', value: 'c' }
]

const finished = new Set(['a'])

function isChecked(node: Record<string, any>) {
  return finished.has(node.value)
}
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="nodes" :check="isChecked">
    <template #icon="{ node }">
      <Check v-if="finished.has(node.value)" style="font-size: 10px" />
    </template>
    <template #default="{ node, index }">
      {{ index + 1 }}. {{ node.label }}
    </template>
  </u-progress-nodes>
</template>
```

## 注意事项

> [!WARNING]
> - 本库组件名是 `UProgressNodes`（节点进度），不是步骤条 `USteps`；需要带方向箭头的步骤导航时用 `USteps`。
> - 当前节点匹配是全等比较：`modelValue: 1` 匹配不上 `value: '1'`，类型必须一致。
> - 点击节点一定触发 `update:modelValue`，与 `check` 无关；`check` 只控制「已完成」的视觉标记。
> - 节点 DOM 的复用键取 `node.key` 字段，节点数组会动态增删时必须为每项提供稳定 `key`，否则以索引复用。
> - 原生滚动条被隐藏，溢出后靠鼠标拖拽（`cursor: grab`）或触控板滚动；`maxWidth` 传 `number` 时按 `px` 处理。
> - 视觉依赖 `--u-*` 主题 token，独立页面必须先执行 `loadTheme()` 初始化主题。

## 常见问题

### 点击节点后不高亮

原因：`modelValue` 与 `node[valueKey]` 不全等，常见于 `string` / `number` 类型不一致。修复：统一类型。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UProgressNodes } from '@veltra/desktop'

const current = ref(1) // 与 value 的 number 类型一致
const nodes = [
  { label: '第一步', value: 1 },
  { label: '第二步', value: 2 }
]
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="nodes" />
</template>
```
