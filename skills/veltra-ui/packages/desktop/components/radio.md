# URadio — 单选框

> `import type { RadioProps, RadioEmits, RadioExposed } from '@veltra/desktop'`

单个单选框，通常配合 `URadioGroup` 使用。通过 `v-model` 绑定选中值，`value` 指定当前选项的值。支持与 `UForm` 集成，自动继承表单的 `size` 和 `disabled`。

## Import

```ts
import { URadio } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any` | — | 当前选中值（v-model） |
| `value` | `any` | — | 选项值，当 `modelValue === value` 时选中 |
| `label` | `string` | — | 显示文本 |
| `disabled` | `boolean` | `false` | 是否禁用（可从父级 `UForm` 继承） |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 尺寸（可从父级 `UForm` 继承） |

继承自 `FormComponentProps`：

| prop | type | default | 说明 |
|------|------|---------|------|
| `tips` | `string` | — | 表单内的提示文字 |
| `span` | `number \| 'full' \| BreakpointSpan` | — | 所占列宽 |
| `field` | `string` | — | 表单项字段名 |
| `readonly` | `boolean` | — | 是否只读 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: any)` | 选中值变化时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 自定义标签内容，覆盖 `label` prop |

## Exposed

```ts
interface RadioExposed {
  change: (isChecked: boolean) => void
}
```

| method | 说明 |
|--------|------|
| `change(isChecked)` | 手动切换选中状态 |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('a')
</script>

<template>
  <u-radio v-model="selected" value="a" label="选项 A" />
  <u-radio v-model="selected" value="b" label="选项 B" />
  <u-radio v-model="selected" value="c">选项 C（slot）</u-radio>
</template>
```

### 禁用

```vue
<u-radio v-model="selected" value="a" label="禁用选项" disabled />
```

### 不同尺寸

```vue
<u-radio v-model="selected" value="a" label="小号" size="small" />
<u-radio v-model="selected" value="b" label="默认" />
<u-radio v-model="selected" value="c" label="大号" size="large" />
```

### 配合 URadioGroup 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'

const gender = ref('')
const options = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <u-radio-group v-model="gender" :items="options" />
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。如需单个 Radio 在表单内，建议改用 `URadioGroup`。表单内自动继承 `size`、`disabled` 等属性。

```vue
<script setup>
import { UForm, URadio, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  gender: formField({ value: '' })
})
</script>

<template>
  <u-form :model="model" size="small" disabled>
    <u-radio v-model="model.data.gender" value="male" label="男" />
    <u-radio v-model="model.data.gender" value="female" label="女" />
  </u-form>
</template>
```
