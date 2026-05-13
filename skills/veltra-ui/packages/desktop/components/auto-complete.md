# UAutoComplete — 自动补全

> `import type { AutoCompleteProps, AutoCompleteEmits, AutoCompleteExposed } from '@veltra/desktop'`

基于 `UDropdown` + `UInput` 的自动补全组件，支持静态/异步建议列表、键盘导航、选中缓存。

## Import

```ts
import { UAutoComplete } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 当前选中/输入的值 |
| `placeholder` | `string` | `'请输入'` | 输入框占位符 |
| `suggestions` | `string[] \| (() => Promise<string[]> \| string[])` | — | 建议项列表，支持静态数组或返回数组/Promise 的工厂函数 |
| `clearable` | `boolean` | `true` | 是否可一键清空 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 组件尺寸（继承自 `ComponentProps`，通过 `useFormFallbackProps` 与表单上下文合并） |
| `disabled` | `boolean` | `false` | 是否禁用（继承自 `FormComponentProps`） |
| `readonly` | `boolean` | `false` | 是否只读（只读时仅展示文本） |
| `tips` | `string` | — | 表单控件内的提示（继承自 `FormComponentProps`） |
| `label` | `string` | — | 表单标签文字（继承自 `FormComponentProps`） |
| `field` | `string` | — | 表单项字段名（继承自 `FormComponentProps`） |
| `span` | `number \| 'full' \| { [key in BreakpointName]?: 'full' \| number; default: number \| 'full' }` | — | 所占列大小（继承自 `FormComponentProps`） |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | `v-model` 双向绑定更新事件 |
| `select` | `(value: string)` | 选中某个建议项时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ option: string; index: number }` | 自定义单条建议项的渲染模板，`index` 为 `-1` 时表示用户当前输入值（不在建议列表中的缓存项） |
| `suffix` | — | 透传给内部 `UInput` 的 `#suffix` 插槽 |
| `prefix` | — | 透传给内部 `UInput` 的 `#prefix` 插槽 |

## Exposed

```ts
interface AutoCompleteExposed {}
```

无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const query = ref('')
const fruits = ['Apple', 'Banana', 'Cherry', 'Durian', 'Grape', 'Mango', 'Orange', 'Peach']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fruits" placeholder="输入水果名称" />
</template>
```

### 异步建议

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const query = ref('')

async function fetchSuggestions(keyword?: string): Promise<string[]> {
  if (!keyword) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
  return res.json()
}
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fetchSuggestions" placeholder="搜索..." />
</template>
```

### 自定义选项模板

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const query = ref('')
const users = ['Alice', 'Bob', 'Charlie', 'Diana']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="users">
    <template #default="{ option }">
      <span style="font-weight: bold;">👤 {{ option }}</span>
    </template>
  </u-auto-complete>
</template>
```

### 只读模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const query = ref('Apple')
const fruits = ['Apple', 'Banana', 'Cherry']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fruits" readonly />
</template>
```
