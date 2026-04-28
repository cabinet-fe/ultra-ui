# UContextMenu — 右键菜单

> `import type { ContextMenuProps, ContextMenuEmits } from '@veltra/desktop'`

## Import

```ts
import { UContextMenu } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `mousePosition` | `{ x: number, y: number }` | — |
| `width` | `number \| string` | `200` |
| `menus` | `ContextMenuItem[] \| Function` | — |

### ContextMenuItem

| prop | type | 说明
|------|------|------
| `label` | `string` | |
| `description` | `string` | 可选 |
| `icon` | `Component` | 可选 |
| `callback` | `Function` | 可选 |
| `disabled` | `boolean \| Function` | 可选 |

## Emits

| event | 参数
|-------|------
| `destroy` | — |

## Exposed

无暴露属性。

## Examples

```vue
<u-context-menu :menus="menus" :mouse-position="pos" />
```
