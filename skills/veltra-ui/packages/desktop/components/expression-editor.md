# UExpressionEditor：表达式编辑器

> `import type { ExpressionEditorProps, ExpressionEditorEmits, ExpressionEditorExposed, VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'`

用于编辑「普通文本 + 变量 chip」组成的表达式。对外 `v-model` 始终是字符串，变量按 `{value}` 序列化，例如：`你好{form.user.name}`。

继承 `FormComponentProps`，支持在 UForm 中联动 `size` / `disabled` / `readonly`。

## Import

```ts
// UExpressionEditor 由 Vite 自动导入，无需手动 import
import type { VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | `undefined` | 表达式字符串，变量使用 `{value}` 占位 |
| `placeholder` | `string` | `'请输入表达式，输入 @ 可插入变量'` | 空内容占位文案 |
| `variables` | `VariableItem[]` | `undefined` | 可选变量树 |
| `selectableLevels` | `ExpressionSelectableLevels` | `'leaf'` | 变量选择范围。`'leaf'`：仅叶子节点可选，分支节点上 Enter / → 进入下一级；`'any'`：分支节点上 Enter 选中分支本身、→ 进入下一级 |
| `size` | `ComponentSize` | `undefined` | 组件尺寸（`'small'` / `'default'` / `'large'`），继承自 `ComponentProps` |
| `disabled` | `boolean` | `undefined` | 禁用态，关闭编辑与变量选择面板，继承自 `FormComponentProps` |
| `readonly` | `boolean` | `undefined` | 只读态，保留文本选择但关闭编辑与变量选择面板，继承自 `FormComponentProps` |
| `tips` | `string` | `undefined` | 表单控件内提示文字，继承自 `FormComponentProps` |
| `span` | `number \| 'full' \| { [key in BreakpointName]?: 'full' \| number } & { default: number \| 'full' }` | `undefined` | 所占列大小，继承自 `FormComponentProps` |
| `label` | `string` | `undefined` | 表单项标签文字，继承自 `FormComponentProps` |
| `field` | `string` | `undefined` | 表单项字段名，继承自 `FormComponentProps` |

### VariableItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 展示名称 |
| `value` | `string` | 序列化到表达式中的变量值，对应 `{value}` 占位 |
| `type` | `string`（可选） | 类型标识，chip 展示为 `label (type)` |
| `children` | `VariableItem[]`（可选） | 子级变量，支持树形结构 |

### ExpressionSelectableLevels

```ts
type ExpressionSelectableLevels = 'leaf' | 'any'
```

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string) => void` | 表达式内容变更，变量按 `{value}` 格式输出 |

## Slots

无插槽。

## Exposed

```ts
interface ExpressionEditorExposed {}
```

## Examples

### 基础使用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('你好{form.user.name}')

const variables: VariableItem[] = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      {
        label: '用户信息',
        value: 'form.user',
        children: [
          { label: '姓名', value: 'form.user.name', type: 'string' },
          { label: '年龄', value: 'form.user.age', type: 'number' }
        ]
      }
    ]
  }
]
</script>

<template>
  <u-expression-editor v-model="expression" :variables="variables" />
</template>
```

### 允许选择分支变量

```vue
<template>
  <u-expression-editor
    v-model="expression"
    :variables="variables"
    selectable-levels="any"
  />
</template>
```

### 禁用与只读

```vue
<template>
  <u-expression-editor v-model="expression" :variables="variables" disabled />
  <u-expression-editor v-model="expression" :variables="variables" readonly />
</template>
```

### 平坦变量列表

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { VariableItem } from '@veltra/desktop'

const expression = ref('')

const variables: VariableItem[] = [
  { label: '当前用户', value: 'user.name', type: 'string' },
  { label: '当前日期', value: 'date.today', type: 'date' },
  { label: '订单金额', value: 'order.amount', type: 'number' },
  { label: '是否会员', value: 'user.vip', type: 'boolean' }
]
</script>

<template>
  <u-expression-editor v-model="expression" :variables="variables" placeholder="输入表达式，@ 可插入变量" />
</template>
```
