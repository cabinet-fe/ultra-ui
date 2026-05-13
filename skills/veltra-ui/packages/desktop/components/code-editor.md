# UCodeEditor — 代码编辑器

> `import type { CodeEditorProps, CodeEditorEmits } from '@veltra/desktop'`

基于 CodeMirror 6 的代码编辑器组件，支持 JS/TS、SQL、Java、JSON 四种语言语法高亮，暗色主题切换，以及最小行数撑高。继承 `FormComponentProps`（不含 `size`），可在 `UForm` 中自动联动 `disabled`/`readonly`。

## Import

```ts
// UCodeEditor 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 编辑器内容 |
| `language` | `'js' \| 'sql' \| 'java' \| 'json'` | — | 代码语言，切换时异步加载对应 CodeMirror 语言包 |
| `dark` | `boolean` | `false` | 是否使用暗色主题（基于 `@codemirror/theme-one-dark`） |
| `defaultLines` | `number` | `8` | 默认显示的行数，用于撑起编辑器最小高度。当实际代码行数少于该值时，通过虚拟行号补齐；超出后出现滚动条 |
| `disabled` | `boolean` | `false` | 是否禁用（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`） |
| `readonly` | `boolean` | `false` | 是否只读（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`） |
| `label` | `string` | — | 表单标签文字（继承自 `FormComponentProps`） |
| `field` | `string` | — | 表单项字段（继承自 `FormComponentProps`） |
| `tips` | `string` | — | 表单控件内的提示信息（继承自 `FormComponentProps`） |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列大小（继承自 `FormComponentProps`） |

> 该组件**不支持** `size` prop（`CodeEditorProps` 显式排除了 `FormComponentProps` 中的 `size`）。

<br>

> `disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承，运行时 fallback 均为 `false`。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 编辑器内容变化时实时更新 |

## Slots

无插槽。

## Exposed

```ts
interface CodeEditorExposed {}
```

无暴露属性。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const code = shallowRef('console.log("Hello, World!")')
</script>

<template>
  <u-code-editor v-model="code" language="js" />
</template>
```

### 暗色主题 + JSON 编辑

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const jsonCode = shallowRef(`{
  "name": "Ultra UI",
  "version": "1.0.0"
}`)
</script>

<template>
  <u-code-editor v-model="jsonCode" language="json" dark :default-lines="6" />
</template>
```

### 只读代码展示 + 自定义行数

```vue
<script setup lang="ts">
const snippet = `SELECT *
FROM users
WHERE status = 'active'
ORDER BY created_at DESC`
</script>

<template>
  <u-code-editor :model-value="snippet" language="sql" readonly :default-lines="5" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  script: ''
})
</script>

<template>
  <u-form :model="form">
    <u-code-editor
      label="自定义脚本"
      field="script"
      language="js"
      :default-lines="12"
      tips="请输入合法的 JavaScript 代码"
    />
  </u-form>
</template>
```
