# UBatchEdit — 批量编辑

> `import type { BatchEditProps } from '@veltra/desktop'`

## Import

```ts
import { UBatchEdit } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `model` | `Model` | — |
| `title` | `string` | — |
| `cols` | `string \| [string, string]` | — |
| `readonly` | `boolean` | — |
| `labelWidth` | `string \| number` | — |
| `deleteMethod` | `Function` | — |
| `saveMethod` | `Function` | — |
| `features` | `Array<...>` | — |
| `actionsProps` | `...` | — |

## Emits

| event | 参数
|-------|------
| `update:data` | `(value: Record<string, any>[])` |

## Exposed

无暴露属性。

## Examples

```vue
<u-batch-edit :data="list" :columns="columns" />
```
