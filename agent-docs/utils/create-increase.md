---
title: createIncrease
description: 创建一个从指定初值开始的自增函数
---

`createIncrease(initial?)` 返回无参函数；每次调用返回当前值后把内部计数加 1（后置递增）。`initial` 默认 `1000`。包内 `zIndex` 即用 `createIncrease(1000)` 生成。

```ts
import { createIncrease } from '@veltra/utils'

const nextId = createIncrease(1)
nextId() // 1
nextId() // 2
```
