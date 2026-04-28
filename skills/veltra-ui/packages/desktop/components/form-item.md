# UFormItem — 表单项

> `import type { FormItemProps } from '@veltra/desktop'`

## Import

```ts
import { UFormItem } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `labelWidth` | `string \| number` | — | 标签宽度
| `...FormComponentProps` | — | — | 通用表单组件属性

## Examples

```vue
<u-form-item label="名称"><u-input v-model="name" /></u-form-item>
```
