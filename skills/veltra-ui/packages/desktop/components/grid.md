# UGrid — 栅格布局

> `import type { GridProps, GridEmits } from '@veltra/desktop'`

## Import

```ts
import { UGrid, UGridItem } from '@veltra/desktop'
```

## UGrid Props

| prop | type | default | 说明
|------|------|---------|------
| `cols` | `number \| BreakCols \| Function` | `24` | 栅格列数
| `tag` | `string` | — | 自定义标签
| `gap` | `number \| string` | — | 间距

## UGridItem Props

| prop | type | default | 说明
|------|------|---------|------
| `span` | `number \| 'full' \| object` | — | 所占列数
| `tag` | `string` | — | 自定义标签

## Emits

| event | 参数
|-------|------
| `resize` | `(rect: DOMRect)` — 容器大小变化
| `breakpoint-change` | `(breakpoint: Breakpoint)` — 断点变化

## Exposed

```ts
interface GridExposed {
  el: HTMLElement | null
}
```

## Examples

```vue
<u-grid :cols="24"><u-grid-item :span="12">左</u-grid-item></u-grid>
```
