# UExpressionEditor：表达式编辑器

> `import type { ExpressionEditorProps, ExpressionEditorEmits, ExpressionEditorExposed, VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'`

用于编辑「普通文本 + 变量 chip」组成的表达式。对外 `v-model` 始终是字符串，变量按 `{value}` 序列化，例如：`你好{form.user.name}`。

继承 `FormComponentProps`，支持在 UForm 中联动 `size` / `disabled` / `readonly`。

## Import

```ts
import { UExpressionEditor } from '@veltra/desktop'
import type { VariableItem } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | `undefined` | 表达式字符串，变量使用 `{value}` 占位 |
| `placeholder` | `string` | `'请输入表达式，输入 @ 可插入变量'` | 空内容占位 |
| `variables` | `VariableItem[]` | `undefined` | 变量树 |
| `selectableLevels` | `ExpressionSelectableLevels` | `'leaf'` | 变量选择范围，`'leaf'` 仅叶子可选，`'any'` 分支也可选 |
| `size` | `ComponentSize` | `undefined` | 表单尺寸，来自 `FormComponentProps` |
| `disabled` | `boolean` | `undefined` | 禁用，关闭编辑与变量面板 |
| `readonly` | `boolean` | `undefined` | 只读，关闭编辑与变量面板但保留文本选择 |

### VariableItem

| prop | type | 说明 |
|------|------|------|
| `label` | `string` | 展示名称 |
| `value` | `string` | 序列化到表达式中的变量值 |
| `type` | `string` | 可选类型标识，chip 展示为 `label (type)` |
| `children` | `VariableItem[]` | 子级变量，支持树形结构 |

### ExpressionSelectableLevels

```ts
type ExpressionSelectableLevels = 'leaf' | 'any'
```

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 表达式变化，变量按 `{value}` 输出 |

## Exposed

无暴露属性或方法。

## 交互

- 输入 `@` 打开变量选择面板；继续输入字符后进入过滤态，按 `label` 做不区分大小写的子串匹配。
- `@filter` 过滤态使用扁平列表；`selectableLevels='leaf'` 只包含叶子，`'any'` 包含叶子和分支，并显示路径预览。
- 未输入过滤词时使用逐级变量树；非根层级显示面包屑。
- 面板键盘：`ArrowUp` / `ArrowDown` 移动 active 项，`Escape` 关闭，`ArrowLeft` 在逐级模式返回上一级。
- 逐级模式下 `ArrowRight` 在分支项进入下一级；`Enter` 在 `leaf` 模式遇到分支也进入下一级，在 `any` 模式遇到分支则选中分支本身。
- mention 激活时按空格、`ArrowLeft` 或 `ArrowRight` 会退出 mention，并保留 `@filter` 为普通文本。
- 变量 chip 是 `contenteditable=false` 的原子节点；点击 chip 主体会在原位置打开变量面板重选，hover 后点击 `×` 删除。
- 未在 `variables` 中找到的 `{value}` 仍会渲染为 chip，`label` 回退为 `value`。

## 实现约定

- 当前实现不再依赖 Lexical；不要重新引入旧的 `internal/`、`nodes/variable-node.tsx`、`use-editor.ts`、`use-context.ts` 等旧架构。
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
<u-expression-editor
  v-model="expression"
  :variables="variables"
  selectable-levels="any"
/>
```

### 禁用与只读

```vue
<u-expression-editor v-model="expression" :variables="variables" disabled />
<u-expression-editor v-model="expression" :variables="variables" readonly />
```
