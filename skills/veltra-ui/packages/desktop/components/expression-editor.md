# UExpressionEditor：表达式编辑器

> `import type { ExpressionEditorProps, ExpressionEditorEmits, ExpressionEditorExposed, VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'`

用于编辑「普通文本 + 变量 chip」组成的表达式。对外 `v-model` 始终是字符串，变量按 `{value}` 序列化，例如：`你好{form.user.name}`。

继承 `FormComponentProps`，支持在 UForm 中联动 `size` / `disabled` / `readonly`。

## Import

```ts
import { UExpressionEditor } from '@veltra/desktop'
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

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: string) => void` | 表达式内容变更，变量按 `{value}` 格式输出 |

## Slots

无插槽。

## Exposed

无暴露属性或方法（`_ExpressionEditorExposed` 为空接口）。

## 交互规则

- 输入 `@` 打开变量选择面板；继续输入字符后进入过滤态，按 `label` 做不区分大小写的子串匹配。
- `@filter` 过滤态使用扁平列表；`selectableLevels='leaf'` 只包含叶子，`'any'` 包含叶子和分支，并显示路径预览。
- 未输入过滤词时使用逐级变量树；非根层级显示面包屑。
- 面板键盘：`ArrowUp` / `ArrowDown` 移动 active 项，`Escape` 关闭，`ArrowLeft` 在逐级模式返回上一级。
- 逐级模式下 `ArrowRight` 在分支项进入下一级；`Enter` 在 `leaf` 模式遇到分支也进入下一级，在 `any` 模式遇到分支则选中分支本身。
- mention 激活时按空格、`ArrowLeft` 或 `ArrowRight` 会退出 mention，并保留 `@filter` 为普通文本。
- 变量 chip 是 `contenteditable=false` 的原子节点；点击 chip 主体会在原位置打开变量面板重选，hover 后点击 `×` 删除。
- 未在 `variables` 中找到的 `{value}` 仍会渲染为 chip，`label` 回退为 `value`。

## 实现约定

- 当前实现不依赖 Lexical；不要重新引入旧的 `internal/`、`nodes/variable-node.tsx`、`use-editor.ts`、`use-context.ts` 等旧架构。
- 主组件在 `expression-editor.vue`，核心拆在 `core/model.ts`、`core/editor.ts`、`core/mention.ts`、`core/chip.ts`。
- `core/model.ts` 负责 `parse` / `serialize` / `normalize`，变量语法是 `/\{([^}]+)\}/g`；未闭合 `{` 保持普通文本。
- `core/editor.ts` 直接管理 contenteditable DOM，DOM 中每个 text / var segment 对应一个 span；渲染时会在 var 两侧补空 text span，保证光标可停靠。
- 粘贴只取 `text/plain`；`compositionstart` 到 `compositionend` 期间不触发 DOM 同步和 selection 变更，避免中文 IME 输入时 mention 抖动。
- `variables` 变化时通过 `createVariableMap` 刷新 chip 的 `label` / `type`，`modelValue` 字符串协议不变。
- `VariablePicker` 使用 `UTip`，`style.ts` 需要继续导入 `tip`、`icon`、`scroll`、`empty` 相关样式。
- 相关测试在 `__test__/model.test.ts`、`mention.test.ts`、`chip.test.ts`、`editor.test.ts`。

## Examples

### 基础使用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UExpressionEditor } from '@veltra/desktop'
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
import { UExpressionEditor } from '@veltra/desktop'
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
