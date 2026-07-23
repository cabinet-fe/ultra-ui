# useConfig / setDocumentSize - 全局配置

## 示例

见 `./examples.md`

## 类型

```ts
import type { ComponentSize } from '@veltra/utils'
import type { Readonly } from 'vue'

interface State {
  animation: boolean
  size: ComponentSize
  form: { labelWidth?: number | string }
  paginator: { pageSize: number; pageSizeOptions: number[] }
}

function useConfig(): {
  config: Readonly<State>
  setConfig: (conf: Partial<State>) => void
}

function setDocumentSize(size: ComponentSize, oldSize?: ComponentSize): void
```

## 说明

- `config` 只读；`setConfig` 对嵌套对象（如 `form`、`paginator`）深合并。
- 首次调用 `useConfig` 后，`config.size` 变化会自动同步 `<html>` 上的 size 类名（内部调用 `setDocumentSize`）。
- `labelPosition` **不在** `config.form` 中，由 `UForm` 经 `@veltra/utils` 的 `FormContextProps` provide。
