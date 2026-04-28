# UBreadcrumb — 面包屑

> `import type { BreadcrumbProps, BreadcrumbEmits } from '@veltra/desktop'`

## Import

```ts
import { UBreadcrumb } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `items` | `BreadcrumbItem[]` | — |
| `size` | `ComponentSize` | — |
| `lastLinked` | `boolean` | — |

### BreadcrumbItem

| prop | type | 说明
|------|------|------
| `title` | `string` | |
| `href` | `string` | 可选 |
| `disabled` | `boolean` | 可选 |

## Emits

| event | 参数
|-------|------
| `click` | `(item: BreadcrumbItem, index: number, ev: Event)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-breadcrumb :items="[{title:\"首页\"},{title:\"列表\"}]" />
```
