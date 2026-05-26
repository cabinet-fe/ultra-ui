# UConditionEditor — 条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits, ConditionEditorExposed, ConditionExpression, ConditionGroup, ConditionItem, ConditionValue, ConditionField } from '@veltra/desktop'`

可视化条件规则构建器：嵌套 AND/OR 分组、`@` 变量注入（VariablePicker）、数据求值。`v-model` 绑定 `ConditionExpression` JSON 树，序列化时自动排除 `_result` 和空分组。

## Import

```ts
// UConditionEditor 由 Vite 自动导入，无需手动 import
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'
```

## 关联类型

```ts
type ConditionExpression = ConditionGroup

interface ConditionGroup {
  logic: 'and' | 'or'
  conditions: ConditionItem[]
  groups: ConditionGroup[]
  _result?: boolean       // 求值结果，序列化时排除
}

interface ConditionItem {
  field: string           // 字段 key（对应 ConditionField.value）
  operator: string        // 'eq' / 'gt' / 'contains' / ...
  value: ConditionValue
  _result?: boolean
}

type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

interface ConditionField {
  label: string
  value: string                                                          // 字段 key
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'                // 决定可用运算符
  enumOptions?: { label: string; value: string }[]                       // type='enum' 时用
}

interface VariableItem {       // 来自 expression-editor，支持树形
  label: string
  value: string                // 变量路径，如 'currentUser.status'
  type?: string
  children?: VariableItem[]
}
```

## Props

继承 `FormComponentProps`（`size` / `disabled` / `readonly` 自动从 UForm 上下文继承），追加：

| prop         | type                      | default     | 说明                                                 |
| ------------ | ------------------------- | ----------- | ---------------------------------------------------- |
| `modelValue` | `ConditionExpression`     | `undefined` | 条件表达式树                                         |
| `fields`     | `ConditionField[]`        | `[]`        | 可用字段，决定字段下拉与运算符筛选                   |
| `variables`  | `VariableItem[]`          | `undefined` | 变量列表，`undefined` 时禁用 `@` 触发（纯文本输入）  |
| `data`       | `Record<string, unknown>` | `undefined` | 变量实际数据，传入后自动求值并标记 `_result`         |

## Emits

| event               | 参数                             | 说明                                  |
| ------------------- | -------------------------------- | ------------------------------------- |
| `update:modelValue` | `(value: ConditionExpression)`   | 条件树变化（已剔除 `_result`/空组）   |
| `evaluate`          | `(results: ConditionExpression)` | 求值完成（节点带 `_result`）          |

## Slots / Exposed

无。

## Examples

### 基础使用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'

const expression = shallowRef<ConditionExpression>({
  logic: 'and',
  conditions: [
    { field: 'status', operator: 'eq', value: { kind: 'constant', value: '进行中' } },
    { field: 'priority', operator: 'gt', value: { kind: 'constant', value: '3' } }
  ],
  groups: []
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' },
  { label: '已完成', value: 'completed', type: 'boolean' },
  { label: '截止日期', value: 'deadline', type: 'date' },
  {
    label: '类型', value: 'type', type: 'enum',
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

### 变量注入 + 数据求值

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'

const expression = shallowRef<ConditionExpression>({
  logic: 'and',
  conditions: [
    { field: 'status', operator: 'eq', value: { kind: 'variable', name: 'currentUser.status' } }
  ],
  groups: [
    {
      logic: 'or',
      conditions: [{ field: 'tag', operator: 'contains', value: { kind: 'constant', value: '紧急' } }],
      groups: []
    }
  ]
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '标签', value: 'tag', type: 'string' }
]

const variables: VariableItem[] = [
  {
    label: '当前用户', value: 'currentUser',
    children: [
      { label: '姓名', value: 'currentUser.name' },
      { label: '状态', value: 'currentUser.status' }
    ]
  }
]

const evalData = { currentUser: { name: '李四', status: 'active' } }
</script>

<template>
  <u-condition-editor
    v-model="expression"
    :fields="fields"
    :variables="variables"
    :data="evalData"
    @evaluate="r => console.log('求值结果:', r)"
  />
</template>
```

### 禁用 / 只读

```vue
<u-condition-editor v-model="expression" :fields="fields" disabled />
<u-condition-editor v-model="expression" :fields="fields" readonly />
```
