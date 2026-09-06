---
title: shallowComputed
description: 用 shallowRef 跟踪 getter 结果的浅层计算值
---

`shallowComputed(getter)` 立刻执行 `getter` 写入 `shallowRef`，再用 `watch(getter)` 同步后续结果。返回 `ShallowRef<T>`，不是 Vue `computed`：不懒求值、没有 `computed` 的 stop / debug 接口，赋值替换整个 `.value`（浅层）。

```ts
import { shallowComputed } from '@veltra/utils'
import { ref } from 'vue'

const source = ref({ id: 1, nested: { n: 0 } })
const snapshot = shallowComputed(() => source.value)

snapshot.value // 与 getter 当前返回值相同的对象引用
```
