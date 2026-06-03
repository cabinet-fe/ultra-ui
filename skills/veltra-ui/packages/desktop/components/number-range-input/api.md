# UNumberRangeInput — 数字范围输入框

> `import type { NumberRangeInputProps, NumberRangeInputEmits, NumberRangeInputExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/number-range-input.ts`

数字范围输入组件，由两个 `UNumberInput` 组成（起始值 + 结束值），中间以分隔符连接。支持双向绑定 `v-model`（`[start, end]` 元组），也可通过 `v-model:start` / `v-model:end` 分别绑定。内部自动保证 start ≤ end。`readonly` 时显示为格式化纯文本。

## Import

```ts
// UNumberRangeInput 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
