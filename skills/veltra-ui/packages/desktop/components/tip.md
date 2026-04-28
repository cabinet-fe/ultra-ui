# UTip — 提示

> `import type { TipProps, TipEmits } from '@veltra/desktop'`

## Import

```ts
import { UTip } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `alignment` | — | — | 对齐方式
| `direction` | — | — | 弹出方向
| `trigger` | — | — | 触发方式
| `contentTag` | — | — | 内容容器标签

基础浮层提示组件，支持多种触发方式和弹出方向。

## Examples

```vue
<u-tip content="提示内容">
  <u-button>悬停提示</u-button>
</u-tip>
```
