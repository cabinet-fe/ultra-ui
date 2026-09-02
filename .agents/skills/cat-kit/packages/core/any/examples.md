# 任意值拷贝 — 示例

```ts
import { copy } from '@cat-kit/core'

const state = { count: 1, nested: { n: 2 }, createdAt: new Date(), run: () => 'ok' }
const snapshot = copy(state)

snapshot.nested.n = 9
state.nested.n // 2
snapshot.run === state.run // true，函数保留同一引用

const cyclic: { self?: unknown } = {}
cyclic.self = cyclic
const clonedCyclic = copy(cyclic)
clonedCyclic.self === clonedCyclic // true，快照内循环引用仍指向自身
```
