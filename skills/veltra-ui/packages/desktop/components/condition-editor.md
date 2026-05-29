# UConditionEditor — 条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits, ConditionEditorExposed, ConditionExpression, ConditionGroup, ConditionLeaf, ConditionNode, ConditionConnector, ConditionValue, ConditionField, VariableItem } from '@veltra/desktop'`

可视化条件规则构建器：

- 树状嵌套分组，**同组内每两个相邻子项之间可独立切换 AND / OR**（混合逻辑）
- `@` 触发 `VariablePicker` 注入变量引用
- 表达式 JSON 树是纯配置数据，不再包含运行期 `_result` 字段
- 求值由独立纯函数 `evaluateConditionExpression(expr, options)` 完成，与编辑器解耦

## Import

```ts
// UConditionEditor 由 Vite 自动导入，无需手动 import
import { evaluateConditionExpression } from '@veltra/desktop'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'
```

## 关联类型

```ts
type ConditionExpression = ConditionGroup

interface ConditionGroup {
  type: 'group'
  children: ConditionNode[]
  /** `connectors[i]` 连接 `children[i]` 与 `children[i+1]`，长度 = children.length - 1 */
  connectors: ConditionConnector[]
}

type ConditionConnector = 'and' | 'or'
type ConditionNode = ConditionLeaf | ConditionGroup

interface ConditionLeaf {
  type: 'condition'
  field: string // 字段 key
  operator: string // 'eq' / 'gt' / 'contains' / ...
  value: ConditionValue
}

type ConditionValue = { kind: 'constant'; value: string } | { kind: 'variable'; name: string }

interface ConditionField {
  label: string
  value: string // 字段 key
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' // 决定可用运算符与值控件
  enumOptions?: { label: string; value: string }[] // type='enum' 时用
}

interface VariableItem {
  label: string
  value: string // 变量路径，如 'currentUser.status'
  type?: string
  children?: VariableItem[]
}
```

## Props

继承 `FormComponentProps`（`size` / `disabled` / `readonly` 自动从 UForm 上下文继承）：

| prop         | type                  | default     | 说明                                                |
| ------------ | --------------------- | ----------- | --------------------------------------------------- |
| `modelValue` | `ConditionExpression` | `undefined` | 条件表达式树（纯配置数据）                          |
| `fields`     | `ConditionField[]`    | `[]`        | 可用字段，决定字段下拉与运算符筛选                  |
| `variables`  | `VariableItem[]`      | `undefined` | 变量列表，`undefined` 时禁用 `@` 触发（纯文本输入） |

## Emits

| event               | 参数                           | 说明       |
| ------------------- | ------------------------------ | ---------- |
| `update:modelValue` | `(value: ConditionExpression)` | 条件树变化 |

## 求值

```ts
import { evaluateConditionExpression } from '@veltra/desktop'

const ok = evaluateConditionExpression(expression, {
  fields, // 提供字段定义可启用类型感知比较（number/boolean/date）
  data // 上下文数据，用于解析 kind: 'variable' 引用
})
```

- 纯函数，**不修改入参**
- 空表达式（无任何叶子）视为 `true`（"无限制"）
- 同组内 AND / OR 按 **从左到右、等优先级** 求值；如需 `AND > OR` 等优先级请用子组显式分组
- 字段类型决定比较语义：`number` 走数值、`boolean` 走真值、`date` 走时间戳、其余走字符串

## 工厂函数

```ts
import { createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'

createEmptyGroup() // → { type: 'group', children: [], connectors: [] }
createEmptyLeaf() // → { type: 'condition', field: '', operator: 'eq', value: { kind: 'constant', value: '' } }
```

## Examples

### 基础使用

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

### 嵌套分组 + 混合逻辑

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

### 变量注入 + 运行期求值

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

### 禁用 / 只读

```vue
<u-condition-editor v-model="expression" :fields="fields" disabled />
<u-condition-editor v-model="expression" :fields="fields" readonly />
```
