# USteps — 步骤条

> `import type { StepsProps, StepsEmits, StepsExposed } from '@veltra/desktop/types'`

展示操作流程的进度导航组件，支持水平和垂直两种方向，每个步骤可自定义图标、内容和悬停提示。

## Import

```ts
// USteps 由 Vite 自动导入，无需手动 import
import type { StepsProps, StepsEmits, StepsExposed, StepsSlotScope } from '@veltra/desktop/types'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `items` | `Record<string, any>[]` | — | 步骤项列表 |
| `current` | `string \| number` | — | 当前步骤值。不传时所有步骤均为待处理状态 |
| `currentKey` | `string` | — | 指定后，`current` 将作为 `items` 中该字段的值来匹配当前步骤项 |
| `labelKey` | `string` | `'label'` | 步骤项中用作标签文本的字段名 |
| `size` | `ComponentSize` | `'default'` | 尺寸 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向 |
| `alignCenter` | `boolean` | — | 是否居中对齐 |
| `currentStepType` | `ColorType` | — | 当前步骤的颜色类型 |
| `finishedStepType` | `ColorType` | `'success'` | 已完成步骤的颜色类型 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:current` | `(value?: string \| number)` | 点击步骤时触发，用于 `v-model:current` |
| `item-click` | `(item: Record<string, any>, index: number)` | 点击步骤项时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|-------|------|
| `icon` | `{ item: Record<string, any>, index: number }` | 步骤图标。默认：已完成步骤显示对勾图标，未完成步骤显示序号 `index + 1` |
| `content` | `{ item: Record<string, any>, index: number }` | 步骤内容。默认显示 `item[labelKey]` |
| `tip` | `{ item: Record<string, any>, index: number }` | 悬停提示。提供此插槽后，鼠标悬停在步骤图标上时会显示 `UTip` 弹出框 |

## Exposed

```ts
interface StepsExposed {}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(0)
const items = [
  { label: '步骤一' },
  { label: '步骤二' },
  { label: '步骤三' }
]
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
</template>
```

### 垂直方向 + 自定义颜色

```vue
<template>
  <u-steps
    v-model:current="current"
    :items="items"
    direction="vertical"
    current-step-type="warning"
    finished-step-type="primary"
  />
</template>
```

### 通过 currentKey 匹配步骤

```vue
<script setup lang="ts">
const current = ref('review')
const items = [
  { name: '填写信息', key: 'info' },
  { name: '审核中', key: 'review' },
  { name: '完成', key: 'done' }
]
</script>

<template>
  <u-steps
    v-model:current="current"
    :items="items"
    label-key="name"
    current-key="key"
  />
</template>
```

### 自定义插槽

```vue
<template>
  <u-steps v-model:current="current" :items="items">
    <template #icon="{ item, index }">
      <u-icon>
        <component :is="item.icon" />
      </u-icon>
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
