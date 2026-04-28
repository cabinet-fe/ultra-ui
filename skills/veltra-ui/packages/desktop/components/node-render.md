# UNodeRender — 节点渲染

> `import type { NodeRenderProps } from '@veltra/desktop'`

## Import

```ts
import { UNodeRender } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `content` | `null \| undefined \| VNode[] \| VNode` | — | 渲染内容

## Examples

```vue
<u-node-render :content="vnode" />
```
