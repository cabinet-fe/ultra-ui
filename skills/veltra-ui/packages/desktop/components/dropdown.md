# UDropdown — 下拉菜单

> `import type { DropdownProps, DropdownEmits } from '@veltra/desktop'`

## Import

```ts
import { UDropdown } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `trigger` | `'hover' \| 'click' \| 'custom'` | `'hover'` |
| `width` | `string` | — |
| `minWidth` | `string` | — |
| `contentTag` | `string` | — |
| `contentClass` | `unknown` | — |
| `contentStyle` | `CSSProperties` | — |
| `visible` | `boolean` | — |
| `disabled` | `boolean` | — |

## Emits

| event | 参数
|-------|------
| `update:visible` | `(visible: boolean)` |
| `keydown` | `(event: KeyboardEvent)` |

## Exposed

```ts
interface DropdownExposed {
  open: (config?: any) => void
  close: () => void
  updateDropdown: () => void
}
```

## Examples

```vue
<u-dropdown><u-button>悬停</u-button></u-dropdown>
```
