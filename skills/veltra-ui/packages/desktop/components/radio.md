# URadio — 单选框

> `import type { RadioProps, RadioEmits } from '@veltra/desktop'`

## Import

```ts
import { URadio } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `value` | `any` | — | 选项值
| `label` | `string` | — | 显示标签
| `disabled` | `boolean` | `false` | 是否禁用
| `modelValue` | `any` | — | 当前选中值

继承 `FormComponentProps`。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: any)` — 选中值变化时触发

## Exposed

| method | 说明
|--------|------
| `change` | `(isChecked: boolean) => void` — 手动切换选中状态

## Examples

```vue
<u-radio v-model="selected" value="a" label="选项A" />
```
