---
title: "UList / UListItem - 列表"
description: "UList / UListItem 组件 API"
---

# UList / UListItem - 列表

## 类型

```ts
import type { ComponentSize, DeconstructValue } from '@veltra/utils'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
```

## 示例

见 `./examples.md`
