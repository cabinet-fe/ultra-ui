# UProgress — 进度条

> `import type { ProgressProps } from '@veltra/desktop'`

## Import

```ts
import { UProgress } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `type` | `ColorType \| Function` | — | 样式类型或自定义函数
| `size` | `number \| string` | — | 尺寸
| `percentage` | `number` | — | 当前进度百分比
| `circle` | `boolean` | `false` | 是否为环形进度

无 Emits。

## Examples

```vue
<u-progress :percentage="60" />
<u-progress :percentage="75" circle />
```
