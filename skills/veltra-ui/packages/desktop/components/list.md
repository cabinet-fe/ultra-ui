# UList — 列表

> `import type { ListProps } from '@veltra/desktop'`

## Import

```ts
import { UList, UListItem } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `size` | `ComponentSize` | — | 尺寸
| `data` | `Record<string, any>[]` | — | 列表数据

## Examples

```vue
<u-list :data="items" />
```
