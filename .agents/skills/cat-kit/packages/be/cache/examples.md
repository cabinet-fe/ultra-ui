# 缓存 — 示例

```ts
import { FileCache, LRUCache, memoize } from '@cat-kit/be'

const memory = new LRUCache<string, number>({ max: 100, ttl: 60_000 })
memory.set('a', 1)

const disk = new FileCache<string>({ dir: './.cache' })
await disk.set('user:1', 'alice')

const loadUser = memoize(async (id: string) => ({ id }), { ttl: 60_000 })
await loadUser('1')
loadUser.clear()
```
