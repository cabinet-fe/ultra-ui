# URadioGroup — 单选框组

> `import type { RadioGroupProps, RadioGroupEmits, RadioGroupExposed } from '@veltra/desktop'`

一组单选框，基于 `URadio` 渲染。支持双向绑定、表单上下文联动、只读模式。

## Import

```ts
// URadioGroup 由 Vite 自动导入，无需手动 import
```

## Props

| prop           | type                                     | default   | 说明                                              |
| -------------- | ---------------------------------------- | --------- | ------------------------------------------------- |
| `modelValue`   | `any`                                    | —         | 当前选中值，支持 `v-model`                        |
| `items`        | `Record<string, any>[]`                  | —         | 选项列表                                          |
| `valueKey`     | `string`                                 | `'value'` | 选项值对应的字段名                                |
| `labelKey`     | `string`                                 | `'label'` | 选项标签文本对应的字段名                          |
| `block`        | `boolean`                                | —         | 是否块级布局，每个选项独占一行                    |
| `disabledItem` | `(item: Record<string, any>) => boolean` | —         | 判断选项是否禁用的函数。禁用优先级高于 `disabled` |

继承自 `FormComponentProps`，支持以下表单属性（通过 `useFormFallbackProps` 与表单上下文联动，未传入时回退到表单/全局配置）：

| prop       | type                                   | default     | 说明                                                     |
| ---------- | -------------------------------------- | ----------- | -------------------------------------------------------- |
| `size`     | `'small' \| 'default' \| 'large'`      | `'default'` | 组件尺寸                                                 |
| `disabled` | `boolean`                              | `false`     | 是否禁用全部选项                                         |
| `readonly` | `boolean`                              | `false`     | 是否只读。只读时显示选中项的标签文本（未选中时显示 `-`） |
| `tips`     | `string`                               | —           | 表单控件内的提示文本                                     |
| `span`     | `number \| 'full' \| BreakpointObject` | —           | 所占列大小                                               |
| `label`    | `string`                               | —           | 表单标签文字                                             |
| `field`    | `string`                               | —           | 表单项字段名                                             |

## Emits

| event               | 参数                          | 说明                                         |
| ------------------- | ----------------------------- | -------------------------------------------- |
| `update:modelValue` | `(modelValue: any)`           | 选中值变化时触发，用于 `v-model`             |
| `change`            | `(item: Record<string, any>)` | 选项变更时触发，参数为当前选中的完整选项对象 |

## Slots

无。

## Exposed

```ts
interface RadioGroupExposed {}
```

组件无对外暴露的方法或属性。

## Examples

基础用法：

```vue
<script setup>
const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
const selected = ref('a')
</script>

<template>
  <u-radio-group v-model="selected" :items="options" />
</template>
```

禁用部分选项：

```vue
<u-radio-group v-model="selected" :items="options" :disabled-item="(item) => item.value === 'c'" />
```

块级布局：

```vue
<u-radio-group v-model="selected" :items="options" block />
```

只读模式：

```vue
<u-radio-group v-model="selected" :items="options" readonly />
```

自定义键名：

```vue
<u-radio-group v-model="selected" :items="options" value-key="id" label-key="name" />
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写 `u-form-item` 和 `v-model`。

```vue
<script setup>
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ choice: formField({ value: '' }) })

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
</script>

<template>
  <u-form :model="model" size="small">
    <u-radio-group label="选择" field="choice" :items="options" />
  </u-form>
</template>
```
