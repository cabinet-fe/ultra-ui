# URadioGroup — 单选组

> `import type { RadioGroupProps, RadioGroupEmits } from '@veltra/desktop'`

## Import

```ts
import { URadioGroup } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `any` | — | 当前选中值
| `items` | `Record<string, any>[]` | — | 选项列表
| `valueKey` | `string` | `'value'` | 选项值字段
| `labelKey` | `string` | `'label'` | 选项标签字段
| `disabled` | `boolean` | `false` | 是否禁用
| `disabledItem` | `Function` | — | 判断选项是否禁用的函数
| `block` | `boolean` | `false` | 是否块级显示

继承 `FormComponentProps`。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(modelValue)` — 选中值变化时触发
| `change` | `(item)` — 选中项变化时触发

## Examples

```vue
<u-radio-group v-model="selected" :items="options" />
```
