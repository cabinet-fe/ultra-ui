# UPalette — 调色板

> `import type { PaletteProps, PaletteEmits } from '@veltra/desktop'`

## Import

```ts
import { UPalette } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 当前颜色值
| `disabled` | `boolean` | `false` | 是否禁用
| `readonly` | `boolean` | `false` | 是否只读

继承 `FormComponentProps`。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 颜色值变化时触发

## Examples

```vue
<u-palette v-model="color" />
```
