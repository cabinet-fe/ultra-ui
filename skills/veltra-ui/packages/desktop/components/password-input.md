# UPasswordInput — 密码输入框

> `import type { PasswordInputProps, PasswordInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UPasswordInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 密码值

继承 `InputProps`。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 输入时触发

## Examples

```vue
<u-password-input v-model="password" />
```
