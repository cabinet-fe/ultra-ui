# UProgressNodes — 进度节点

> `import type { ProgressNodesProps, ProgressNodesEmits, ProgressNodesExposed } from '@veltra/desktop'`

## Import

```ts
// UProgressNodes 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string \| number` | — | 当前选中节点的值 |
| `nodes` | `Record<string, any>[]` | — | 节点列表 |
| `check` | `(node: Record<string, any>, index: number) => boolean` | — | 自定义节点选中判断，返回 `true` 标记为已完成 |
| `colorType` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 高亮颜色类型 |
| `maxWidth` | `number \| string` | — | 容器最大宽度，超出可水平拖拽滚动 |
| `labelKey` | `string` | `'label'` | 节点列表中标签字段的键名 |
| `valueKey` | `string` | `'value'` | 节点列表中值字段的键名 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string \| number)` | 点击节点时更新 `v-model` 绑定的值 |
| `click` | `(node: Record<string, any>, index: number)` | 点击节点时触发，传递节点数据和索引 |

## Slots

| slot | 作用域 | 说明 |
|------|-------|------|
| `icon` | `{ node: Record<string, any>, index: number }` | 自定义节点圆点内的图标 |
| `default` | `{ node: Record<string, any>, index: number }` | 自定义节点标签内容，默认展示 `labelKey` 对应字段 |

## Exposed

```ts
interface ProgressNodesExposed {}
```

## Examples

**基础用法 — 用 v-model 绑定选中值：**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('step-2')
const steps = [
  { label: '创建', value: 'step-1' },
  { label: '审核', value: 'step-2' },
  { label: '发布', value: 'step-3' },
]
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="steps" />
</template>
```

**通过 `check` 控制已完成状态：**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('step-3')
const finishedSteps = ref(['step-1', 'step-2'])

const nodes = [
  { label: '需求分析', value: 'step-1' },
  { label: '方案设计', value: 'step-2' },
  { label: '开发实现', value: 'step-3' },
  { label: '测试验收', value: 'step-4' },
  { label: '上线部署', value: 'step-5' },
]

function isFinished(node: Record<string, any>, _index: number) {
  return finishedSteps.value.includes(node.value)
}
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="nodes" :check="isFinished" color-type="success" />
</template>
```

**自定义插槽 — 图标和标签：**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('done')
const nodes = [
  { label: '待处理', value: 'todo', status: 'wait' },
  { label: '进行中', value: 'doing', status: 'active' },
  { label: '已完成', value: 'done', status: 'finish' },
]
</script>

<template>
  <u-progress-nodes v-model="current" :nodes="nodes">
    <template #icon="{ node }">
      <span v-if="node.status === 'finish'">✓</span>
      <span v-else-if="node.status === 'active'">●</span>
      <span v-else>○</span>
    </template>
    <template #default="{ node }">
      <span :style="{ fontWeight: node.status === 'active' ? 'bold' : 'normal' }">
        {{ node.label }}
      </span>
    </template>
  </u-progress-nodes>
</template>
```

**自定义字段键名 + 限制最大宽度：**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(2)
const nodes = [
  { name: '阶段一', id: 1 },
  { name: '阶段二', id: 2 },
  { name: '阶段三', id: 3 },
  { name: '阶段四', id: 4 },
  { name: '阶段五', id: 5 },
  { name: '阶段六', id: 6 },
]
</script>

<template>
  <u-progress-nodes
    v-model="current"
    :nodes="nodes"
    label-key="name"
    value-key="id"
    color-type="warning"
    :max-width="600"
  />
</template>
```
