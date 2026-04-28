# ULayout — 布局容器

> `import type { LayoutProps } from '@veltra/desktop'`

## Import

```ts
import { ULayout } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `tag` | `string` | `"div"` | 自定义标签
| `gap` | `number \| string` | — | 间距
| `cols` | `string[] \| string` | — | 列定义
| `rows` | `string[] \| string` | — | 行定义
| `resizable` | `boolean` | `false` | 是否可拖拽调整尺寸

## Examples

```vue
<u-layout><div>区域一</div><div>区域二</div></u-layout>
```
