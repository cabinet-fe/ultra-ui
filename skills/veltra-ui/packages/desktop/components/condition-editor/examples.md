# UConditionEditor 示例

## 基础使用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'

const expression = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: ['and'],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'constant', value: '进行中' }
    },
    {
      type: 'condition',
      field: 'priority',
      operator: 'gt',
      value: { kind: 'constant', value: '3' }
    }
  ]
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' },
  { label: '已完成', value: 'completed', type: 'boolean' },
  { label: '截止日期', value: 'deadline', type: 'date' },
  {
    label: '类型',
    value: 'type',
    type: 'enum',
    enumOptions: [
      { label: '需求', value: 'requirement' },
      { label: '缺陷', value: 'bug' }
    ]
  }
]
</script>

<template>
  <u-condition-editor v-model="expression" :fields="fields" />
</template>
```

## 嵌套分组 + 混合逻辑

```ts
// 表达式语义：status == open AND (priority > 3 OR tag contains '紧急')
const expression: ConditionExpression = {
  type: 'group',
  connectors: ['and'],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'constant', value: 'open' }
    },
    {
      type: 'group',
      connectors: ['or'],
      children: [
        {
          type: 'condition',
          field: 'priority',
          operator: 'gt',
          value: { kind: 'constant', value: '3' }
        },
        {
          type: 'condition',
          field: 'tag',
          operator: 'contains',
          value: { kind: 'constant', value: '紧急' }
        }
      ]
    }
  ]
}
```

## 变量注入 + 运行期求值

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { evaluateConditionExpression } from '@veltra/desktop'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'

const expression = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: [],
  children: [
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'variable', name: 'currentUser.status' }
    }
  ]
})

const fields: ConditionField[] = [{ label: '状态', value: 'status', type: 'string' }]
const variables: VariableItem[] = [
  {
    label: '当前用户',
    value: 'currentUser',
    children: [{ label: '状态', value: 'currentUser.status' }]
  }
]

const data = { currentUser: { status: 'active' } }
const ok = computed(() => evaluateConditionExpression(expression.value, { fields, data }))
</script>

<template>
  <u-condition-editor v-model="expression" :fields="fields" :variables="variables" />
  <div>是否满足条件：{{ ok }}</div>
</template>
```

## 禁用 / 只读

```vue
<u-condition-editor v-model="expression" :fields="fields" disabled />
<u-condition-editor v-model="expression" :fields="fields" readonly />
```
