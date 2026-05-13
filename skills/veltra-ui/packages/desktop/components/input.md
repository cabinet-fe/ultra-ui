# UInput — 输入框

> `import type { InputProps, InputEmits, InputExposed } from '@veltra/desktop'`

文本输入组件，支持前后缀、清除按钮、输入防呆（pattern）、IME 组合输入处理。继承 `FormComponentProps`，可在 UForm 中自动联动 `size`/`disabled`/`readonly`。当 `readonly` 为 `true` 时，整个输入框替换为纯文本展示（`prefix + value + suffix`）。

## Import

```ts
// UInput 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 输入值 |
| `placeholder` | `string` | `'请输入'` | 占位符 |
| `prefix` | `string` | — | 前缀文本 |
| `suffix` | `string` | — | 后缀文本 |
| `clearable` | `boolean` | `true` | 是否可清除（hover 且有值时显示清除图标） |
| `nativeReadonly` | `boolean` | — | 原生只读（保留输入框外观，设置 `<input readonly>`） |
| `pattern` | `RegExp` | — | 输入防呆，限制用户只能输入匹配该正则的字符（原生 `<input>` pattern 机制） |
| `size` | `ComponentSize` | `'default'` | 尺寸（继承自 `ComponentProps`，回退到全局配置 → `'default'`） |
| `disabled` | `boolean` | `false` | 禁用（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`） |
| `readonly` | `boolean` | `false` | 只读（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`）。开启后输入框隐藏，显示纯文本。 |
| `label` | `string` | — | 表单标签文字（继承自 `FormComponentProps`） |
| `field` | `string` | — | 表单项字段（继承自 `FormComponentProps`） |
| `tips` | `string` | — | 表单控件内的提示信息（继承自 `FormComponentProps`） |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; ... }` | — | 所占列大小（继承自 `FormComponentProps`） |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 输入时实时更新（IME 组合输入期间不触发） |
| `change` | `(value: string)` | 失焦或回车时触发（原生 change 事件） |
| `prefix:click` | `(value?: string)` | 前缀区域点击，`value` 为当前输入值 |
| `suffix:click` | `(value?: string)` | 后缀区域点击，`value` 为当前输入值 |
| `focus` | `(value?: string)` | 获得焦点 |
| `blur` | `(value?: string)` | 失去焦点 |
| `clear` | `()` | 点击清除按钮 |
| `native:input` | `(ev: Event)` | 原生 input 事件 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `prefix` | — | 前缀插槽，与 `prefix` prop 文本同时渲染 |
| `suffix` | — | 后缀插槽，与 `suffix` prop 文本同时渲染 |

## Exposed

```ts
interface InputExposed {
  /** 原生 &lt;input&gt; 元素引用 */
  el: HTMLInputElement | undefined
}
```

## Examples

### 基础用法

```vue
<script setup>
import { shallowRef } from 'vue'
const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="请输入关键词" />
</template>
```

### 前后缀图标

```vue
<script setup>
import { shallowRef } from 'vue'
import { Search } from '@veltra/icons/normal'

const keyword = shallowRef('')
function handleSearch() {
  console.log('搜索:', keyword.value)
}
</script>

<template>
  <u-input
    v-model="keyword"
    placeholder="搜索"
    @suffix:click="handleSearch"
  >
    <template #suffix>
      <u-icon :size="16"><Search /></u-icon>
    </template>
  </u-input>
</template>
```

### 输入防呆（pattern）

`pattern` 限制用户只能输入匹配正则的字符，并非校验机制。

```vue
<script setup>
import { shallowRef } from 'vue'
const phone = shallowRef('')
</script>

<template>
  <u-input v-model="phone" placeholder="手机号" :pattern="/^\d*$/" />
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。

```vue
<script setup>
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  username: formField({ value: '', required: true })
})
</script>

<template>
  <u-form :model="model">
    <u-input label="用户名" field="username" placeholder="请输入用户名" />
  </u-form>
</template>
```
