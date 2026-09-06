---
title: "UNodeRender - 节点渲染"
description: "UNodeRender 组件 API"
---

# UNodeRender - 节点渲染

## 类型

```ts
import type { VNode } from 'vue'

/** 虚拟dom渲染组件属性 */
export interface NodeRenderProps {
  content: null | undefined | Array<VNode> | VNode
}

/** 虚拟dom渲染暴露的属性和方法 */
export interface NodeRenderExposed {}
```

## 示例

见 `./examples.md`
