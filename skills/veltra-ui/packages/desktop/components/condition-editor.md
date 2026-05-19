# ConditionEditor — 条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits, ConditionEditorExposed, ConditionExpression, ConditionGroup, ConditionItem, ConditionValue, ConditionField } from '@veltra/desktop'`

可视化条件规则构建器，支持嵌套 AND/OR 分组、变量注入（`@` 触发 VariablePicker）、数据求值。对外通过 `v-model` 绑定 `ConditionExpression` JSON 树结构，序列化时自动排除 `_result` 和空分组。

## Import

```ts
// UConditionEditor 由 Vite 自动导入，无需手动 import
import type { ConditionExpression, ConditionField } from '@veltra/desktop'
```

## Props

| prop         | type                      | default     | 说明                                                         |
| ------------ | ------------------------- | ----------- | ------------------------------------------------------------ |
| `modelValue` | `ConditionExpression`     | `undefined` | 条件表达式树（v-model 绑定值）                               |
| `fields`     | `ConditionField[]`        | `[]`        | 可用字段列表，决定字段下拉和运算符筛选                       |
| `variables`  | `VariableItem[]`          | `undefined` | 可用变量列表，`undefined` 时不提供变量注入（纯文本输入）     |
| `data`       | `Record<string, unknown>` | `undefined` | 变量实际数据，传入后自动求值并更新 UI 中的行/组结果标记      |
| `size`       | `ComponentSize`           | `undefined` | 表单尺寸，`FormComponentProps` 继承，支持 `UForm` 上下文继承 |
| `disabled`   | `boolean`                 | `undefined` | 禁用状态，禁止所有交互                                       |
| `readonly`   | `boolean`                 | `undefined` | 只读状态，禁止编辑但保留查看                                 |

## Types

### ConditionExpression

条件表达式即根 `ConditionGroup`：

```ts
type ConditionExpression = ConditionGroup
```

### ConditionGroup

| prop         | type               | 说明                       |
| ------------ | ------------------ | -------------------------- |
| `logic`      | `'and' \| 'or'`    | 逻辑运算符                 |
| `conditions` | `ConditionItem[]`  | 子条件列表                 |
| `groups`     | `ConditionGroup[]` | 嵌套子分组                 |
| `_result`    | `boolean`          | 内部求值结果，序列化时排除 |

### ConditionItem

| prop       | type             | 说明                                        |
| ---------- | ---------------- | ------------------------------------------- |
| `field`    | `string`         | 字段 key，对应 `ConditionField.value`       |
| `operator` | `string`         | 运算符 key，如 `'eq'`、`'gt'`、`'contains'` |
| `value`    | `ConditionValue` | 条件值（常量或变量引用）                    |
| `_result`  | `boolean`        | 内部求值结果，序列化时排除                  |

### ConditionValue

```ts
type ConditionValue = { kind: 'constant'; value: string } | { kind: 'variable'; name: string }
```

### ConditionField

| prop          | type                                                    | 说明                                    |
| ------------- | ------------------------------------------------------- | --------------------------------------- |
| `label`       | `string`                                                | 展示名称                                |
| `value`       | `string`                                                | 字段 key，与 `ConditionItem.field` 对应 |
| `type`        | `'string' \| 'number' \| 'boolean' \| 'date' \| 'enum'` | 字段类型，决定可用运算符列表            |
| `enumOptions` | `{ label: string; value: string }[]`                    | 枚举选项，`type='enum'` 时使用          |

### VariableItem

定义在 `@veltra/desktop` 的 `expression-editor` 类型中：

| prop       | type             | 说明                                  |
| ---------- | ---------------- | ------------------------------------- |
| `label`    | `string`         | 展示名称                              |
| `value`    | `string`         | 变量路径，如 `'currentUser.status'`   |
| `type`     | `string`         | 可选类型标识（如 `string`、`number`） |
| `children` | `VariableItem[]` | 子级变量，支持树形结构                |

## Emits

| event               | 参数                             | 说明                                              |
| ------------------- | -------------------------------- | ------------------------------------------------- |
| `update:modelValue` | `(value: ConditionExpression)`   | 条件树变化时触发，序列化时排除 `_result` 和空分组 |
| `evaluate`          | `(results: ConditionExpression)` | 求值完成后触发，results 中各节点带 `_result` 标记 |

## Slots

该组件无插槽。

## Exposed

```ts
interface ConditionEditorExposed {}
```

该组件无公开方法或属性。

## Examples

### 1. 基础使用

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
  { label: '标签', value: 'tag', type: 'string' },
  { label: '已完成', value: 'completed', type: 'boolean' },
  { label: '截止日期', value: 'deadline', type: 'date' },
  {
    label: '类型',
    value: 'type',
    type: 'enum',
    enumOptions: [
      { label: '需求', value: 'requirement' },
      { label: '缺陷', value: 'bug' },
      { label: '任务', value: 'task' }
    ]
  }
]
</script>

<template>
  <u-condition-editor v-model="expression" :fields="fields" />
</template>
```

### 2. 带变量注入和数据求值

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'

const expression = shallowRef<ConditionExpression>({
  logic: 'and',
  conditions: [
    { field: 'status', operator: 'eq', value: { kind: 'variable', name: 'currentUser.status' } },
    { field: 'assignee', operator: 'eq', value: { kind: 'constant', value: '张三' } }
  ],
  groups: [
    {
      logic: 'or',
      conditions: [
        { field: 'tag', operator: 'contains', value: { kind: 'constant', value: '紧急' } }
      ],
      groups: []
    }
  ]
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '负责人', value: 'assignee', type: 'string' },
  { label: '标签', value: 'tag', type: 'string' }
]

const variables: VariableItem[] = [
  {
    label: '当前用户',
    value: 'currentUser',
    children: [
      { label: '姓名', value: 'currentUser.name' },
      { label: '角色', value: 'currentUser.role' },
      { label: '状态', value: 'currentUser.status' }
    ]
  }
]

const evalData = { currentUser: { name: '李四', role: 'admin', status: 'active' } }

function onEvaluate(result: ConditionExpression) {
  console.log('求值结果:', result)
}
</script>

<template>
  <u-condition-editor
    v-model="expression"
    :fields="fields"
    :variables="variables"
    :data="evalData"
    @evaluate="onEvaluate"
  />
</template>
```

### 3. 禁用与只读

```vue
<template>
  <u-condition-editor v-model="expression" :fields="fields" disabled />
  <u-condition-editor v-model="expression" :fields="fields" readonly />
</template>
```

### 4. 不带变量注入（纯文本输入）

不传 `variables` 时，值输入为普通文本输入框，无 `@` 触发变量选择功能：

```vue
<template>
  <u-condition-editor v-model="expression" :fields="fields" />
</template>
```
