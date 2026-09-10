---
title: UConditionEditor 条件编辑器
description: "可视化编辑条件表达式 JSON 的组件：分组与叶子节点树形编排、行间 AND/OR 连接符切换、按字段类型给出运算符与值控件、值输入支持 @ 引用变量；配套 evaluateConditionExpression、createEmptyGroup、createEmptyLeaf 纯函数在运行期求值。"
aliases: [ConditionEditor, condition-editor, 条件构造器, 条件规则编辑器, 规则编辑器, QueryBuilder]
keywords: ["update:modelValue", modelValue, fields, ConditionField, ConditionGroup, ConditionLeaf, ConditionValue, ConditionExpression, connectors, operator, evaluateConditionExpression, createEmptyGroup, createEmptyLeaf, 条件规则, 求值, 表达式求值, 条件分组, 变量引用, 嵌套条件]
---

# UConditionEditor 条件编辑器

`@veltra/desktop` 导出 `UConditionEditor`、配套纯函数 `evaluateConditionExpression` / `createEmptyGroup` / `createEmptyLeaf` 与类型 `ConditionExpression`、`ConditionField`、`ConditionEvaluateOptions` 等。组件可视化编辑条件规则：`v-model` 是一棵以根分组为顶点的条件树（JSON 对象，不是字符串），编辑产出可直接存库；求值与 UI 解耦，用纯函数在任意位置执行。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UConditionEditor } from '@veltra/desktop'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' }
]

const expr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: [],
  children: [
    { type: 'condition', field: 'status', operator: 'eq', value: { kind: 'constant', value: 'open' } }
  ]
})
</script>

<template>
  <u-condition-editor v-model="expr" :fields="fields" />
  <!-- => 用户增删行、切换 AND/OR 后 expr.value 始终是 ConditionGroup 结构的 JSON 对象 -->
</template>
```

## API 签名

```ts
/** 字段定义 */
export interface ConditionField {
  /** 字段显示名 */
  label: string
  /** 字段标识，对应叶子的 field */
  value: string
  /** 字段类型，决定可选运算符与值控件 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  /** type 为 'enum' 时的可选值下拉 */
  enumOptions?: { label: string; value: string }[]
}

/** 条件右侧值：常量或变量引用 */
export type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

/** 单行条件叶子节点 */
export interface ConditionLeaf {
  type: 'condition'
  /** 字段标识（ConditionField.value） */
  field: string
  /** 运算符标识，小写枚举（如 'eq'），见求值规则一节 */
  operator: string
  value: ConditionValue
}

/** 行间逻辑连接符 */
export type ConditionConnector = 'and' | 'or'

/** 条件组节点 */
export interface ConditionGroup {
  type: 'group'
  children: ConditionNode[]
  /**
   * 子项之间的连接符：
   * connectors[i] 位于 children[i] 与 children[i + 1] 之间；
   * 长度应等于 children.length - 1，缺失项按 'and' 处理
   */
  connectors: ConditionConnector[]
}

/** 树节点：叶子或分组 */
export type ConditionNode = ConditionLeaf | ConditionGroup

/** 顶层表达式 = 根分组 */
export type ConditionExpression = ConditionGroup

export interface ConditionEditorProps {
  /** 绑定条件表达式（根分组 JSON 对象）。传入 null/undefined 时组件内部重置为空分组 */
  modelValue?: ConditionExpression
  /** 字段定义。默认 [] */
  fields?: ConditionField[]
  /** 变量列表，供值的 @ 引用（复用表达式编辑器的 VariableItem） */
  variables?: VariableItem[]
  /** 组件尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 禁用（所有控件不可操作）。默认 false；未设置时优先继承 UForm 的 disabled */
  disabled?: boolean
  /** 只读（隐藏添加/删除入口）。默认 false；未设置时优先继承 UForm 的 readonly */
  readonly?: boolean
}

export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
}

/** ref 上可直接访问的形态：DeconstructValue 解包空对象后无任何成员，ref 上无可用方法 */
export type ConditionEditorExposed = {}

export interface VariableItem {
  label: string
  value: string
  /** 可选类型标识（如 string、number） */
  type?: string
  /** 子级变量（支持树形结构） */
  children?: VariableItem[]
}

/** evaluateConditionExpression 的 options 类型 */
export interface ConditionEvaluateOptions {
  /** 字段定义，提供后按字段类型做类型感知比较 */
  fields?: ConditionField[]
  /** 上下文数据，用于解析 kind: 'variable' 引用与字段取值 */
  data?: Record<string, unknown>
}

/** 对条件表达式求值。纯函数，同步，不修改入参，不抛错（未知 operator 按 false 计） */
export function evaluateConditionExpression(
  expression: ConditionExpression,
  options?: ConditionEvaluateOptions
): boolean

/** 创建空分组 { type: 'group', children: [], connectors: [] } */
export function createEmptyGroup(): ConditionGroup

/** 创建空叶子 { type: 'condition', field: '', operator: 'eq', value: { kind: 'constant', value: '' } } */
export function createEmptyLeaf(): ConditionLeaf
```

### 数据结构不变式

- 顶层表达式必须是 `type: 'group'` 的根分组；叶子 `type` 固定为 `'condition'`，分组固定为 `'group'`。
- `connectors[i]` 描述 `children[i]` 与 `children[i + 1]` 之间的关系；长度等于 `children.length - 1`，缺失或不足的尾部项按 `'and'` 处理（读取与求值均如此）。
- 空分组（`children` 为空）是合法模型，编辑器显示「暂无条件」。
- 组件对外深克隆：外部传入的 `modelValue` 不会被修改；每次编辑 `update:modelValue` 输出的也是克隆副本；外部回写时经 `JSON.stringify` 深比较，相同则不重渲染。
- 嵌套分组无层数限制；每个非根分组通过组内「删除组」按钮移除。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `ConditionExpression` | 内部重置为空分组 | 否 | 必须是根分组 JSON 对象；禁止传字符串 |
| `fields` | `ConditionField[]` | `[]` | 否 | `type` 仅限 5 个枚举值；`type: 'enum'` 时配 `enumOptions` |
| `variables` | `VariableItem[]` | `[]` | 否 | 供值输入 `@` 引用，选中后写成 `{ kind: 'variable', name: value }` |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 优先级：组件 props > UForm > 全局配置 > `'default'` |
| `disabled` | `boolean` | `false` | 否 | 全部控件不可操作 |
| `readonly` | `boolean` | `false` | 否 | 隐藏「添加条件 / 添加条件组 / 删除组 / 删除行」入口 |

## 方法与事件

- `update:modelValue(value: ConditionExpression)`：切换字段、运算符、连接符，修改值，增删行或组时同步触发；`value` 为深克隆后的根分组。
- 组件无暴露方法；规则的读取与判断一律配合 `evaluateConditionExpression`。

### evaluateConditionExpression 求值规则

签名：`evaluateConditionExpression(expression: ConditionExpression, options?: ConditionEvaluateOptions): boolean`，同步、纯函数、不修改入参、不抛错。

- 字段取值：`data` 按 `leaf.field` 的点路径读取（如 `field: 'currentUser.status'` 读 `data.currentUser.status`）；未传 `data` 时所有字段值为 `undefined`。
- 变量取值：`kind: 'variable'` 的右侧值按 `name` 的点路径在 `data` 中读取。
- 空表达式（分组 `children` 为空）返回 `true`（视作「无限制」）。
- 不完整的叶子按 `false` 计：`field` 或 `operator` 缺失；或该运算符需要值但右侧未提供（`constant.value === ''` 或 `variable.name === ''`）。
- 同组内 AND / OR 按**从左到右、等优先级**折叠（`acc && x` / `acc || x`）；需要更高优先级必须用子分组。
- 运算符语义（左侧值为 `data` 中字段值，右侧为解析后的比较值）：

| operator | 中文 | 需要值 | 语义 |
| --- | --- | :---: | --- |
| `eq` / `ne` | 等于 / 不等于 | 是 | 按 `fields` 中字段类型比较：`number` 转 Number、`boolean` 转布尔（`'true'`/`'1'` 为 true）、`date` 转 `new Date(v).getTime()`、其余（`string` / `enum` / 未登记字段）转字符串比较；`ne` 为 `eq` 取反 |
| `contains` / `not_contains` | 包含 / 不包含 | 是 | 双方转字符串后 `includes`；对象转 `JSON.stringify` |
| `gt` / `lt` / `gte` / `lte` | 大于 / 小于 / 大于等于 / 小于等于 | 是 | 双方 `toNumber`（字符串 `Number()`，失败为 NaN，NaN 比较结果为 false）后比较 |
| `before` / `after` | 早于 / 晚于 | 是 | 双方转时间戳（`Date` 对象取 `getTime()`，字符串 `new Date(v)`）后比较 |
| `in` | 包含于（enum） | 是 | 右侧为数组则逐项转字符串；为字符串则按逗号分隔、去空白；左侧转字符串后判断是否在内 |
| `empty` / `not_empty` | 为空 / 不为空 | 否 | 值为 `null`、`undefined`、去空白后空字符串、空数组视为空 |
| `is_true` / `is_false` | 是 / 否 | 否 | 布尔原样；数字非 0 为 true；字符串 `'true'`/`'1'` 为 true、`'false'`/`'0'`/`''` 为 false；其余 `Boolean(v)` |
| 其他任意值 | — | — | 一律返回 `false` |

- 运算符与字段类型的对应关系（编辑器内下拉按此过滤；类型缺失时回落 string 组）：`string`: `eq` `ne` `contains` `not_contains` `empty` `not_empty`；`number`: `eq` `ne` `gt` `lt` `gte` `lte`；`boolean`: `is_true` `is_false`；`date`: `eq` `ne` `before` `after`；`enum`: `eq` `ne` `in`。

### createEmptyGroup / createEmptyLeaf

- `createEmptyGroup(): ConditionGroup` —— 返回 `{ type: 'group', children: [], connectors: [] }`，用作 `v-model` 初始值。
- `createEmptyLeaf(): ConditionLeaf` —— 返回 `{ type: 'condition', field: '', operator: 'eq', value: { kind: 'constant', value: '' } }`，用作「添加一行默认条件」。

## 典型示例

### 基础用法与 JSON 输出

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UConditionEditor } from '@veltra/desktop'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'

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

const expr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: [],
  children: [
    { type: 'condition', field: 'status', operator: 'eq', value: { kind: 'constant', value: 'open' } }
  ]
})
</script>

<template>
  <!-- enum 字段且运算符非 in 时，值渲染为 enumOptions 下拉；
       boolean 渲染 是/否 下拉；number/date 渲染对应类型输入框 -->
  <u-condition-editor v-model="expr" :fields="fields" />
  <pre>{{ JSON.stringify(expr, null, 2) }}</pre>
</template>
```

### 嵌套分组与运行期求值

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { UConditionEditor, evaluateConditionExpression } from '@veltra/desktop'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'

// 语义：status == 'open' AND (priority > 3 OR tag 包含 '紧急')
const expr = shallowRef<ConditionExpression>({
  type: 'group',
  connectors: ['and'],
  children: [
    { type: 'condition', field: 'status', operator: 'eq', value: { kind: 'constant', value: 'open' } },
    {
      type: 'group',
      connectors: ['or'],
      children: [
        { type: 'condition', field: 'priority', operator: 'gt', value: { kind: 'constant', value: '3' } },
        { type: 'condition', field: 'tag', operator: 'contains', value: { kind: 'constant', value: '紧急' } }
      ]
    },
    {
      type: 'condition',
      field: 'status',
      operator: 'eq',
      value: { kind: 'variable', name: 'currentUser.status' }
    }
  ]
})

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' },
  { label: '标签', value: 'tag', type: 'string' }
]

const variables: VariableItem[] = [
  { label: '当前用户', value: 'currentUser', children: [{ label: '状态', value: 'currentUser.status' }] }
]

const data = { status: 'open', priority: 5, tag: '紧急修复', currentUser: { status: 'open' } }

// 求值与编辑器解耦，任意数据上直接调用
const passed = computed(() => evaluateConditionExpression(expr.value, { fields, data }))
</script>

<template>
  <u-condition-editor v-model="expr" :fields="fields" :variables="variables" />
  <p>{{ passed ? '满足条件' : '不满足条件' }}</p>
  <!-- => 传入 data 时为 '满足条件'；值输入框中按 @ 可把值切换为变量引用 chip -->
</template>
```

### 工厂函数构造初始模型

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UConditionEditor, createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'
import type { ConditionExpression, ConditionField } from '@veltra/desktop'

const fields: ConditionField[] = [
  { label: '状态', value: 'status', type: 'string' },
  { label: '优先级', value: 'priority', type: 'number' }
]

// 初始为「一个带默认叶子的根分组」，而不是让用户面对空白组
const root = createEmptyGroup()
root.children = [createEmptyLeaf()]
const expr = shallowRef<ConditionExpression>(root)

function reset() {
  const group = createEmptyGroup()
  group.children = [createEmptyLeaf()]
  expr.value = group
}
</script>

<template>
  <u-condition-editor v-model="expr" :fields="fields" />
  <!-- 初始渲染一行：字段下拉待选、运算符默认 eq、值为空常量 -->
</template>
```

## 注意事项

> [!WARNING]
> - `v-model` 是 JSON 对象（根分组），不是字符串；存库用 `JSON.stringify`，回显用 `JSON.parse` 后的对象。
> - `evaluateConditionExpression` / `createEmptyGroup` / `createEmptyLeaf` 都从 `@veltra/desktop` 导入（内部 `evaluate` 以别名导出）；它们是纯函数，与编辑器 UI 解耦，不传组件实例。
> - 本组件的 props 不含 `label` / `field` / `span` / `rules` 等表单属性，状态绑定只能用 `v-model`；`size` / `disabled` / `readonly` 未设置时继承所属 `UForm` 的同名属性。
> - 运算符是小写枚举标识（`'eq'`、`'gt'`），不是符号（`'='`、`'>'`）；切换字段会把 `operator` 重置为该类型组的第一个运算符并把 `value` 重置为空常量，切换运算符同样清空 `value`。
> - 类型感知比较只在 `fields` 中登记了该字段时生效；`leaf.field` 不在 `fields` 里时按字符串比较，且编辑器内运算符下拉只回显当前值。
> - 同组内 AND / OR 等优先级、从左到右折叠，与 SQL 的 AND 优先于 OR 不同；需要「A OR (B AND C)」必须用子分组表达。
> - 值输入框中键入 `@` 打开变量面板（仅叶子可选）；变量 chip 点击主体重选、点 `×` 或 Delete 键清空为空常量。
> - `in` 运算符的常量值为逗号分隔字符串（编辑器占位「多个值用逗号分隔」），求值时按逗号拆分匹配。
> - 组件颜色依赖 `--u-*` 主题 token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## 常见问题

### 求值结果与预期相反

先检查三点：空表达式（没有任何叶子）返回 `true`（视作无限制）；同组内 `and` / `or` 等优先级从左到右折叠；需要值但值为空的叶子按 `false` 计。修复：用 `children.length > 0` 判空后再求值，优先级逻辑放进子分组。

### 换了一组 `fields` 后，旧条件的运算符下拉空白

`leaf.field` 在新 `fields` 中不存在（`value` 对不上）。修复：保持 `ConditionField.value` 稳定；确需下线字段时先迁移模型中引用该字段的叶子，否则该行运算符无法重新选择、求值按字符串比较。
