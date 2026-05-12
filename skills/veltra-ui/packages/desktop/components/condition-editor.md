# UConditionEditor：条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits, ConditionExpression, ConditionGroup, ConditionItem, ConditionValue, ConditionField } from '@veltra/desktop'`

可视化条件规则构建器，支持嵌套 AND/OR 分组、变量注入、数据求值。对外 `v-model` 是 `ConditionExpression` JSON 树结构。

## Import

```ts
import { UConditionEditor } from '@veltra/desktop'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `ConditionExpression` | `undefined` | 条件表达式树 |
| `fields` | `ConditionField[]` | `[]` | 可用字段列表 |
| `variables` | `VariableItem[]` | `undefined` | 可用变量列表，`undefined` 时不提供变量注入 |
| `data` | `Record<string, unknown>` | `undefined` | 变量实际数据，传入后自动求值并更新 UI 结果 |
| `size` | `ComponentSize` | `undefined` | 表单尺寸，支持 `FormComponentProps` 继承 |
| `disabled` | `boolean` | `undefined` | 禁用，禁止所有交互 |
| `readonly` | `boolean` | `undefined` | 只读，禁止编辑但保留查看 |

## 类型

### ConditionExpression

条件表达式即根 `ConditionGroup`：

```ts
type ConditionExpression = ConditionGroup
```

### ConditionGroup

| prop | type | 说明 |
|------|------|------|
| `logic` | `'and' \| 'or'` | 逻辑运算符 |
| `conditions` | `ConditionItem[]` | 子条件列表 |
| `groups` | `ConditionGroup[]` | 嵌套子分组 |
| `_result` | `boolean` | 内部求值结果，序列化时排除 |

### ConditionItem

| prop | type | 说明 |
|------|------|------|
| `field` | `string` | 字段 key，对应 `ConditionField.value` |
| `operator` | `string` | 运算符 key，如 `'eq'` `'gt'` `'contains'` |
| `value` | `ConditionValue` | 条件值（常量或变量） |
| `_result` | `boolean` | 内部求值结果，序列化时排除 |

### ConditionValue

```ts
type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }
```

### ConditionField

| prop | type | 说明 |
|------|------|------|
| `label` | `string` | 展示名称 |
| `value` | `string` | 字段 key，与 `ConditionItem.field` 对应 |
| `type` | `'string' \| 'number' \| 'boolean' \| 'date' \| 'enum'` | 字段类型，决定可用运算符 |
| `enumOptions` | `{ label: string; value: string }[]` | 枚举选项，`type='enum'` 时使用 |

### VariableItem

与 `UExpressionEditor` 共享，定义在 `expression-editor` 类型中：

| prop | type | 说明 |
|------|------|------|
| `label` | `string` | 展示名称 |
| `value` | `string` | 变量路径，如 `'currentUser.status'` |
| `type` | `string` | 可选类型标识 |
| `children` | `VariableItem[]` | 子级变量，支持树形 |

## 运算符映射

运算符根据字段 `type` 自动筛选。`needValue` 为 `false` 的运算符不显示值输入框。

| 字段类型 | 运算符 |
|----------|--------|
| `string` | eq(等于)、ne(不等于)、contains(包含)、not_contains(不包含)、empty(为空)、not_empty(不为空) |
| `number` | eq(等于)、ne(不等于)、gt(大于)、lt(小于)、gte(大于等于)、lte(小于等于) |
| `boolean` | is_true(是)、is_false(否) |
| `date` | eq(等于)、ne(不等于)、before(早于)、after(晚于) |
| `enum` | eq(等于)、ne(不等于)、in(包含于) |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: ConditionExpression)` | 条件树变化，序列化时排除 `_result` 和空分组 |
| `evaluate` | `(results: ConditionExpression)` | 求值完成，results 中带 `_result` 标记 |

## 交互

- 每个条件行包含：字段选择 → 运算符选择 → 值输入 → 删除 → 求值结果。运算符根据字段类型自动切换可用列表。
- AND/OR 标签在分组左上角，点击切换逻辑运算符。分组使用左边框指示线表达嵌套层级。
- 值输入中按 `@` 打开变量选择面板（复用 `UExpressionEditor` 的 VariablePicker）。选中变量后渲染为 chip，hover 出现 `×` 删除，点击 chip 主体可重新选择变量。
- 运算符为 `empty` / `not_empty` / `is_true` / `is_false` 时，值输入自动隐藏，显示 `—`。
- `data` 传入后自动执行求值：解析变量路径（`.` 分隔），执行运算符比较，行级结果 `✓`/`✗`，分组级 AND/OR 汇总。
- 切换字段时自动重置运算符为该类型第一个可用选项，值清空。
- 切换运算符时值清空。
- 空的子分组在 `v-model` 输出中自动过滤。

## 视觉规范

- 紧凑密度设计：控件高度 28px，行间距 6px，元素间距 4px，字号 12px，圆角 4px
- 嵌套缩进：左边框 `2px solid var(--u-border-muted-color)` + `padding-left 10px` + `margin-left 8px`
- AND tag：蓝底 `var(--u-color-primary-light-9)`，文字 `var(--u-color-primary)`
- OR tag：橙底 `var(--u-color-warning-light-9)`，文字 `var(--u-color-warning)`
- 变量 chip：`border-radius: 999px`，`var(--u-color-primary-light-9)` 底色
- 结果 ✓：`var(--u-color-success)` / ✗：`var(--u-color-danger)` / —：`var(--u-text-color-assist)`

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
  { label: '标签', value: 'tag', type: 'string' },
  { label: '已完成', value: 'completed', type: 'boolean' },
  { label: '截止日期', value: 'deadline', type: 'date' },
  { label: '类型', value: 'type', type: 'enum', enumOptions: [
    { label: '需求', value: 'requirement' },
    { label: '缺陷', value: 'bug' },
    { label: '任务', value: 'task' }
  ]}
]
</script>

<template>
  <u-condition-editor v-model="expression" :fields="fields" />
</template>
```

### 带变量注入和数据求值

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

const evalData = {
  currentUser: { name: '李四', role: 'admin', status: 'active' }
}

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

### 禁用与只读

```vue
<u-condition-editor v-model="expression" :fields="fields" disabled />
<u-condition-editor v-model="expression" :fields="fields" readonly />
```

### 不带变量注入

不传 `variables` 时，值输入为纯文本输入，无 `@` 触发变量选择：

```vue
<u-condition-editor v-model="expression" :fields="fields" />
```
