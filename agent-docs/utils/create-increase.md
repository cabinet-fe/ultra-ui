---
title: createIncrease 自增序号 ID 生成器函数
description: 基础工具函数，创建一个闭包递增计数器函数，从指定初始数值（默认 0）开始每次调用返回自增数字，适用于生成唯一 DOM 元素 id、组件实例编号与临时 key
---

`createIncrease(initial?)` 返回无参函数；每次调用返回当前值后把内部计数加 1（后置递增）。`initial` 默认 `1000`。包内 `zIndex` 即用 `createIncrease(1000)` 生成。

```ts
import { createIncrease } from '@veltra/utils'

const nextId = createIncrease(1)
nextId() // 1
nextId() // 2
```
