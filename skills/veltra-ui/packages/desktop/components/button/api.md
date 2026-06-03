# UButton / UButtonGroup — 按钮

> `import type { ButtonProps, ButtonExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/button.ts`

通用按钮组件，支持语义颜色、尺寸、图标、加载态、朴素/文本模式，内置波纹指令。`UButtonGroup` 通过 slot 作用域统一透传 props 给子按钮。

## Import

```ts
// UButton、UButtonGroup 由 Vite 自动导入，无需手动 import
```

## UButtonGroup

Props 与 `ButtonProps` 完全一致（用于统一控制组内所有按钮）。

| slot      | 作用域                   | 说明                                   |
| --------- | ------------------------ | -------------------------------------- |
| `default` | `{ props: ButtonProps }` | 通过 `v-bind="props"` 透传给每个子按钮 |

> 示例见 [examples.md](./examples.md)
