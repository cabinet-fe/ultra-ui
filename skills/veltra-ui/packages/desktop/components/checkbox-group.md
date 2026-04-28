# UCheckboxGroup — 复选框组

> `import type { CheckboxGroupProps, CheckboxGroupEmits } from '@veltra/desktop'`

## Import

```ts
import { UCheckboxGroup } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `Array<any>` | — | 值 |
| `items` | `Record<string, any>[]` | — | 复选框项 |
| `labelKey` | `string` | — | 标签文本的 key |
| `valueKey` | `string` | — | 值的 key |
| `block` | `boolean` | — | 块级显示 |

## Emits

| event | 参数 |
|-------|------|
| `update:modelValue` | `(value: Array<any>)` |

## Examples

```vue
<u-checkbox-group v-model="selected" :items="options" />
```
