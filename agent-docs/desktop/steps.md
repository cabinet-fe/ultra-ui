---
title: "USteps 步骤条"
description: "步骤条组件：按 items 渲染线性流程，current 控制当前步（索引或 currentKey 指定的业务键），索引之前的步骤显示对勾并按 finishedStepType 着色；支持横向/纵向、居中、自定义图标/文案/悬浮提示插槽。"
aliases: [Steps, ElSteps, 分步条, 向导, 步骤导航]
keywords:
  - current
  - currentKey
  - labelKey
  - direction
  - alignCenter
  - currentStepType
  - finishedStepType
  - item-click
  - update:current
  - v-model:current
  - 分步流程
  - 向导
  - 流程进度
  - 当前步骤
  - 步骤点击
  - 竖向步骤条
---

# USteps 步骤条

`@veltra/desktop` 导出 `USteps`。它按 `items` 渲染一组线性步骤，`current` 指定进行到哪一步；索引小于当前步的项显示对勾并按 `finishedStepType` 着色。适合下单、注册等多步流程的进度展示与步骤跳转；并列视图（无先后顺序）的切换用 `UTabs` 标签页或 `USegment` 分段控制器。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USteps } from '@veltra/desktop'

const current = ref(0)
const items = [{ label: '填写信息' }, { label: '确认订单' }, { label: '支付' }]
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
  <!-- => 第 1 步为当前步（显示序号 1），第 2、3 步显示各自序号 -->
</template>
```

## API 签名

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type ComponentSize = 'small' | 'default' | 'large'

/** 步骤组件属性 */
export interface StepsProps {
  /** 当前步骤。未指定 currentKey 时必须是索引（number），超出后收敛到 [0, items.length - 1]；不传时全部步骤按已完成渲染 */
  current?: string | number
  /** 尺寸 */
  size?: ComponentSize
  /** 步骤项。必填；每项是一个对象，展示字段由 labelKey 指定 */
  items: Record<string, any>[]
  /** 步骤项标签键。默认 'label' */
  labelKey?: string
  /** 当前步骤项键；指定后 current 按 item[currentKey] 匹配，而不是索引 */
  currentKey?: string
  /** 方向。默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'
  /** 是否居中对齐 */
  alignCenter?: boolean
  /** 当前步骤颜色类型；不设置用默认当前步配色 */
  currentStepType?: ColorType
  /** 已完成步骤颜色类型。默认 'success' */
  finishedStepType?: ColorType
}

/** 步骤项插槽作用域 */
export interface StepsSlotScope {
  item: Record<string, any>
  index: number
}

/** 步骤组件事件 */
export interface StepsEmits {
  /** 当前步骤项变更；指定 currentKey 时 payload 为 item[currentKey]，否则为索引 */
  (e: 'update:current', value?: string | number): void
  /** 步骤项点击事件，先于 update:current */
  (e: 'item-click', item: Record<string, any>, index: number): void
}
```

插槽（作用域均为 `StepsSlotScope`，即 `{ item, index }`）：

- `icon`：替换步骤圆点内容；默认渲染为已完成项对勾、未完成项序号。
- `content`：替换步骤文案；默认渲染 `item[labelKey]`。
- `tip`：提供后鼠标悬浮步骤圆点弹出提示，内容为该插槽返回值。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model:current`（`current`） | `string \| number` | — | 否 | 未指定 `currentKey` 时必须是数字索引，传字符串会被忽略（全部步骤渲染为已完成）；索引超出收敛到 `[0, items.length - 1]` |
| `items` | `Record<string, any>[]` | — | 是 | 步骤数据，顺序即流程顺序 |
| `labelKey` | `string` | `'label'` | 否 | 步骤文案取 `item[labelKey]` |
| `currentKey` | `string` | — | 否 | 指定后 `current` 与 `item[currentKey]` 匹配；点击步骤时 `update:current` 的 payload 也改为 `item[currentKey]` |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 否 | 纵向时步骤垂直排列 |
| `alignCenter` | `boolean` | `false` | 否 | 居中对齐 |
| `currentStepType` | `ColorType` | — | 否 | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` |
| `finishedStepType` | `ColorType` | `'success'` | 否 | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`；已完成项的对勾与连线用该颜色 |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'` |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `item-click` | `item: Record<string, any>, index: number` | 点击任意步骤项；没有禁用概念，每一步都可点击 |
| `update:current` | `value?: string \| number` | 点击步骤项后触发（先触发 `item-click`）；设置了 `currentKey` 时 payload 为 `item[currentKey]`，否则为索引 |

- `current` 是 prop + `update:current` 事件的受控模式：必须绑定 `v-model:current`（或自己监听事件更新 `current`），仅传 `:current` 不监听事件时点击步骤不会改变当前步。
- `direction` 为 `horizontal` 时，`current` 变化后当前步骤自动平滑滚入视野（步骤超出容器宽度时）。
- 组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

## 典型示例

### 上一步 / 下一步受控流程

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USteps } from '@veltra/desktop'

const current = ref(0)
const items = [{ label: '填写资料' }, { label: '上传附件' }, { label: '提交审核' }]

function prev() {
  if (current.value > 0) current.value--
}
function next() {
  if (current.value < items.length - 1) current.value++
}
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
  <button :disabled="current === 0" @click="prev">上一步</button>
  <button :disabled="current === items.length - 1" @click="next">下一步</button>
  <!-- => 点击「下一步」后 current 递增，已完成步骤显示对勾 -->
</template>
```

### 业务键匹配与自定义插槽

`current` 用业务 `id` 而不是索引；`icon` / `content` / `tip` 插槽分别自定义圆点、文案与悬浮提示。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USteps } from '@veltra/desktop'
import { Edit, Loading, Check } from '@veltra/icons/normal'

const current = ref('upload')
const items = [
  { id: 'form', label: '填写信息', desc: '填写基础信息', help: '预计 2 分钟', icon: Edit },
  { id: 'upload', label: '审核中', desc: '等待管理员审核', help: '预计 1 个工作日', icon: Loading },
  { id: 'done', label: '完成', desc: '流程全部结束', help: '无需操作', icon: Check }
]

function onItemClick(item: (typeof items)[number], index: number) {
  console.log('点击了', item.id, index) // => 点击第 2 步输出 'upload' 1
}
</script>

<template>
  <u-steps
    v-model:current="current"
    current-key="id"
    direction="vertical"
    current-step-type="warning"
    :items="items"
    @item-click="onItemClick"
  >
    <template #icon="{ item }">
      <component :is="item.icon" />
    </template>
    <template #content="{ item }">
      <strong>{{ item.label }}</strong>
      <small>{{ item.desc }}</small>
    </template>
    <template #tip="{ item }">
      {{ item.help }}
    </template>
  </u-steps>
</template>
```

## 注意事项

> [!WARNING]
> - 本库步骤数据是 `items` prop 数组，不是 Element Plus 的 `<el-step>` 子组件模式。
> - 没有每步独立的 `status`（`error` / `process` / `wait`）字段：已完成/当前步的配色只能整体通过 `finishedStepType` / `currentStepType` 控制，单个步骤不能单独标红。
> - 未指定 `currentKey` 时 `current` 必须是数字索引；传业务字符串会被忽略，全部步骤渲染为已完成（这是「不传 `current` = 全部完成」的同一行为）。
> - `current` 不传时全部步骤显示对勾（视为全部完成），没有「无当前步」的中间态。
> - 步骤没有 `disabled` 概念，点击任何步骤都会触发 `item-click` 与 `update:current`；禁止点击的需求要在自己的处理函数里拦截。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 传了字符串 `current` 但全部步骤都显示已完成

原因：未设置 `currentKey` 时 `current` 按索引解析，非数字返回 `undefined`，所有步骤按已完成渲染。修复：加 `current-key`，让 `current` 按 `item[currentKey]` 匹配：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USteps } from '@veltra/desktop'

const current = ref('review')
const items = [
  { key: 'info', label: '填写信息' },
  { key: 'review', label: '审核中' },
  { key: 'done', label: '完成' }
]
</script>

<template>
  <u-steps v-model:current="current" current-key="key" :items="items" />
  <!-- => 第 2 步「审核中」为当前步 -->
</template>
```

### 点击步骤当前步不变

原因：只传了 `:current` 没有监听 `update:current`。修复：改用 `v-model:current` 绑定。

```vue
<template>
  <u-steps v-model:current="current" :items="items" />
</template>
```
