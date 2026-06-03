# UInput — 输入框

> `import type { InputProps, InputEmits, InputExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/input.ts`

文本输入组件，支持前后缀、清除按钮、输入防呆（pattern）、IME 组合输入处理。继承 `FormComponentProps`，可在 UForm 中自动联动 `size`/`disabled`/`readonly`。当 `readonly` 为 `true` 时，整个输入框替换为纯文本展示（`prefix + value + suffix`）。

## Import

```ts
// UInput 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
