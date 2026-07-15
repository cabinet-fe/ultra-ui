# 数组与对象 — 示例

```ts
import { arr, o, unionBy } from '@cat-kit/core'

const users = unionBy(
  'id',
  [{ id: 1, name: '旧名称' }],
  [
    { id: 1, name: '新名称' },
    { id: 2, name: '第二位' }
  ]
)
// unionBy 保留首次出现 → id:1 仍为「旧名称」

const publicUser = o(users[0]!).pick(['id', 'name'])

const moved = arr(['a', 'b', 'c']).move(0, 2) // ['b', 'c', 'a']
const grouped = arr(users).groupBy((u) => (u.id === 1 ? 'one' : 'other'))

o({ a: 1, b: { c: 2 } }).set('b.c', 9)
```
