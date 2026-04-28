# UDrawer — 抽屉

> `import type { DrawerProps, DrawerEmits } from '@veltra/desktop'`

## Import

```ts
import { UDrawer } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `boolean` | — |
| `direction` | `'left' \| 'right' \| 'top' \| 'bottom'` | — |
| `showClose` | `boolean` | — |
| `title` | `string` | — |

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: boolean)` |
| `close` | — |
| `closed` | — |

## Exposed

无暴露属性。

## Examples

```vue
<u-drawer v-model="visible" title="抽屉">内容</u-drawer>
```
