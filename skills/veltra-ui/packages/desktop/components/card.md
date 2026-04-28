# UCard — 卡片

> `import type { CardProps } from '@veltra/desktop'`

## Import

```ts
import { UCard } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `width` | `string \| number` | — |
| `integrate` | `boolean` | — |

## Sub-components

| component | props | 说明
|-----------|-------|------
| `UCardHeader` | — | 卡片头部
| `UCardCover` | `src: string`, `height?` | 卡片封面
| `UCardContent` | `cover?: boolean` | 卡片内容
| `UCardAction` | `alignRight?: boolean` | 卡片操作区

## Emits

无事件。

## Exposed

无暴露属性。

## Examples

```vue
<u-card><u-card-content>内容</u-card-content></u-card>
```
