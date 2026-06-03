# UNumberInput — 数字输入框

> `import type { NumberInputProps, NumberInputEmits, NumberInputExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/number-input.ts`

数字输入组件，基于 `UInput` 封装，支持精度控制、货币格式化、步进按钮、上下键调整、倍数模式。内部使用 `@cat-kit/core`（`$n`）进行高精度数值运算，步进时带 Tween 动画。`readonly` 时为纯文本展示。

## Import

```ts
// UNumberInput 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
