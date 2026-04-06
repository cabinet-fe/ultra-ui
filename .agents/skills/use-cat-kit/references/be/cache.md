# be — LRU 缓存

```typescript
import { LRUCache } from '@cat-kit/be'

const cache = new LRUCache<string, any>({
  maxSize: 100,
  ttl?: number,
  onEvict?: (key, value) => {}
})

cache.set('key', value, ttl?)
cache.get('key')
cache.has('key')
cache.delete('key')
cache.clear()
cache.size
cache.keys() / cache.values() / cache.entries()
```
