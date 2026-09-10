---
title: UExpressionEditor 表达式编辑器
description: "带 @ 变量插入的表达式输入框：输入 @ 唤起变量面板，支持树形逐级导航与关键字过滤两种模式，变量以 chip 呈现并序列化为 {value} 花括号占位，可控制叶子/分支可选层级、禁用与只读。"
aliases: [ExpressionEditor, expression-editor, 表达式输入框, 变量编辑器, MentionInput]
keywords: ["update:modelValue", modelValue, variables, VariableItem, selectableLevels, placeholder, chip, mention, 变量插入, 变量面板, 花括号占位, 树形变量, 逐级导航, 关键字过滤, 重选变量, 叶子节点, 分支选中]
---

# UExpressionEditor 表达式编辑器

`@veltra/desktop` 导出 `UExpressionEditor` 与变量类型 `VariableItem`。组件用于编排模板文案、路由条件等含变量引用的表达式：文本直接输入，键入 `@` 唤起变量面板插入变量，变量渲染为 chip 并在 `v-model` 字符串中序列化为 `{变量value}` 花括号占位。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UExpressionEditor } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('你好{Name}')

const variables: VariableItem[] = [
  { label: '姓名', value: 'Name', type: 'string' },
  { label: '年龄', value: 'Age', type: 'number' },
  { label: '会员状态', value: 'Vip', type: 'boolean' }
]
</script>

<template>
  <u-expression-editor v-model="expression" :variables="variables" />
  <!-- 用户在编辑器里追加文本“，欢迎回来”后：
       expression.value === '你好{Name}，欢迎回来' -->
</template>
```

`v-model` 绑定 `string`：文本段原样拼接，变量段输出 `{value}`（花括号包变量的 `value` 字段，不是 `label`）。解析按 `/\{([^}]+)\}/g` 切分，`value` 不在 `variables` 中时 chip 文案回落为 `value` 本身。

## API 签名

```ts
export interface VariableItem {
  /** 变量显示名（chip 与面板中展示） */
  label: string
  /** 变量标识，序列化进 v-model（{value}）；全树必须唯一，重复时后声明的覆盖先声明的 */
  value: string
  /** 可选类型标识（如 'string'、'number'），仅透传展示，不参与校验 */
  type?: string
  /** 子级变量（支持树形结构） */
  children?: VariableItem[]
}

/** 选中范围：仅叶子节点，或允许任意层级（含分支） */
export type ExpressionSelectableLevels = 'leaf' | 'any'

export interface ExpressionEditorProps {
  /** 绑定表达式字符串；变量引用写作 {value}。undefined 视同 '' */
  modelValue?: string
  /** 占位文本。默认 '请输入表达式，输入 @ 可插入变量' */
  placeholder?: string
  /** 变量列表（支持树形）。默认 [] */
  variables?: VariableItem[]
  /**
   * 变量可选层级。默认 'leaf'：
   * - 'leaf'：仅叶子可选；面板中分支项上 Enter / → 进入下一级
   * - 'any'：面板中分支项上 Enter 选中分支本身、→ 进入下一级
   */
  selectableLevels?: ExpressionSelectableLevels
  /** 组件尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 表单标签文字，仅在 UForm 内生效 */
  label?: string
  /** 表单字段名；在 UForm 内用 field 绑定 model，此时禁止再写 v-model */
  field?: string
  /** 所占列大小，仅在 UForm 内生效 */
  span?:
    | number
    | 'full'
    | ({ [key in 'xs' | 'sm' | 'md' | 'lg' | 'xl']?: 'full' | number } & {
        default: number | 'full'
      })
  /** 在表单控件内时的提示，仅在 UForm 内生效 */
  tips?: string
  /** 禁用（不可输入，chip 不可重选/删除）。默认 false；未设置时优先继承 UForm 的 disabled */
  disabled?: boolean
  /** 只读。默认 false；未设置时优先继承 UForm 的 readonly */
  readonly?: boolean
  /** 校验规则，仅在 UForm 内生效 */
  rules?: ValidateRule
}

export interface ExpressionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** ref 上可直接访问的形态：DeconstructValue 解包空对象后无任何成员，ref 上无可用方法 */
export type ExpressionEditorExposed = {}

export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设：'email' | 'phone' | 'num' | 'url' | 'idCard' */
  preset?: 'email' | 'phone' | 'num' | 'url' | 'idCard'
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `string` | `''`（undefined 视同 `''`） | 否 | 变量引用必须写成 `{value}`；花括号内禁止包含 `}` |
| `placeholder` | `string` | `'请输入表达式，输入 @ 可插入变量'` | 否 | 内容为空且非禁用时显示 |
| `variables` | `VariableItem[]` | `[]` | 否 | `value` 全树唯一；重复时后声明的覆盖先声明的（chip 显示名按最后一次声明） |
| `selectableLevels` | `'leaf' \| 'any'` | `'leaf'` | 否 | 只影响面板中分支项 Enter 的行为与过滤列表是否包含分支 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 优先级：组件 props > UForm > 全局配置 > `'default'` |
| `label` | `string` | — | 否 | 仅 UForm 内生效 |
| `field` | `string` | — | 否 | 仅 UForm 内生效；设置后禁止再写 `v-model` |
| `span` | `number` / `'full'` / 对象 | — | 否 | 仅 UForm 内生效；对象键为 `xs`/`sm`/`md`/`lg`/`xl` 加必填 `default` |
| `tips` | `string` | — | 否 | 仅 UForm 内生效 |
| `disabled` | `boolean` | `false` | 否 | 禁用时不可输入、chip 不可重选与删除 |
| `readonly` | `boolean` | `false` | 否 | 同 `disabled` 的编辑限制 |
| `rules` | `ValidateRule` | — | 否 | 仅 UForm 内生效 |

## 方法与事件

- `update:modelValue(value: string)`：文本输入、插入/删除/重选变量等任何内容变化时触发；`value` 为序列化字符串（文本原样 + `{value}`）。
- 面板键盘行为（组件内部处理，无对外 API）：`↑` / `↓` 移动高亮项；`Enter` 选中或进入下一级；`←` 逐级模式下返回上一级、过滤模式下不拦截；`→` 分支项进入下一级；`Esc` 关闭面板（`@过滤词` 文本保留为普通字符）；`空格` / `←` / `→` 同时退出过滤模式。
- chip 交互：hover 出现 `×`；点击 chip 主体原地打开面板重选变量；点击 `×` 删除 chip；`Backspace` 在 chip 边界一次删除整个 chip。
- 暴露方法：无。`ExpressionEditorExposed` 为空对象类型。

## 典型示例

### 树形变量与逐级导航

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UExpressionEditor } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('')

const variables: VariableItem[] = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      { label: '姓名', value: 'form.user.name', type: 'string' },
      { label: '年龄', value: 'form.user.age', type: 'number' }
    ]
  },
  {
    label: '系统变量',
    value: 'system',
    children: [{ label: '当前时间', value: 'system.currentTime' }]
  }
]
</script>

<template>
  <!-- 默认 selectableLevels="leaf"：面板先展示顶层分支，
       Enter / → 进入下一级，仅叶子项可选中 -->
  <u-expression-editor v-model="expression" :variables="variables" />
  <!-- 选中“姓名”后 expression.value === '{form.user.name}' -->
</template>
```

### 允许选中分支变量（selectableLevels="any"）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UExpressionEditor } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('选中整个分支：{form.user}')

const variables: VariableItem[] = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      {
        label: '用户信息',
        value: 'form.user',
        children: [
          { label: '姓名', value: 'form.user.name' },
          { label: '年龄', value: 'form.user.age' }
        ]
      }
    ]
  }
]
</script>

<template>
  <!-- 'any'：面板中分支项 Enter 选中分支本身（插入 {form.user}），→ 进入下一级；
       键入 @ 后继续输入字符即时按 label 过滤，过滤列表同时包含分支与叶子 -->
  <u-expression-editor v-model="expression" :variables="variables" selectable-levels="any" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UExpressionEditor } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'

const form = reactive({ template: '' })

const variables: VariableItem[] = [
  { label: '客户名称', value: 'customer.name', type: 'string' },
  { label: '订单编号', value: 'order.no', type: 'string' }
]

function submit() {
  // form.template 形如 '尊敬的{customer.name}，您的订单{order.no}已发货'
  console.log(form.template)
}
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model -->
  <u-form :model="form">
    <u-expression-editor
      label="通知模板"
      field="template"
      :variables="variables"
      :rules="{ required: true }"
      tips="输入 @ 插入变量"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 在 UForm 中必须使用 `field` 绑定 model；已有 `field` 时禁止再写 `v-model`。
> - 本组件基于原生 `contenteditable` 实现，不依赖 CodeMirror 或 Lexical；与 `URichTextEditor` 的 Lexical JSON、`UCodeEditor` 的纯文本互不通用。
> - 变量序列化为 `{value}`，解析正则为 `/\{([^}]+)\}/g`：变量 `value` 禁止包含 `}`，否则序列化结果无法完整解析回 chip；文本内容中的孤立花括号按普通字符处理。
> - `modelValue` 中的 `{xxx}` 即使不在 `variables` 里也会渲染成 chip，chip 文案回落为 `xxx` 本身；补齐 `variables` 后显示名自动刷新。
> - 变量 `value` 全树必须唯一：组件内部用 `value` 建索引，顶层与子级共用，重复声明时后者覆盖前者。
> - 过滤模式按变量 `label` 做「包含」匹配（不区分大小写），不是按 `value` 匹配。
> - 组件颜色依赖 `--u-*` 主题 token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## 常见问题

### 键入 @ 后面板是空的

`variables` 未传或为空数组时面板显示「暂无可用变量」；传了变量但键入了过滤词时，按 `label` 包含匹配无命中也会显示为空。修复：传入 `variables`，或修改过滤词。

```vue
<u-expression-editor v-model="expression" :variables="variables" />
```

### `v-model` 里出现 `{xxx}` 但显示不对

`xxx` 不在 `variables` 中，chip 文案回落为 `xxx` 本身且无类型标识。修复：把对应 `VariableItem` 补进 `variables`，组件会按新列表重渲染 chip 的 `label` 与 `type`。
