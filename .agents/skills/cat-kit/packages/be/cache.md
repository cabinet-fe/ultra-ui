# be — cache

缓存工具：LRU 内存缓存、文件缓存、函数记忆化。

## LRUCache

```ts
class LRUCache<K, V> {
  constructor(options?: LRUCacheOptions)
}

interface LRUCacheOptions {
  maxSize?: number   // 最大条目数，默认 100
  ttl?: number       // 全局 TTL（ms）
}
```

最近最少使用（LRU）淘汰策略的内存缓存。

| 方法 | 说明 |
|------|------|
| `.get(key)` | 获取值，访问时更新 LRU 顺序。过期自动清理返回 undefined |
| `.has(key)` | 检查键是否存在且未过期 |
| `.set(key, value, ttl?)` | 设置值，可覆盖全局 TTL。超容量时淘汰最久未用项 |
| `.delete(key)` | 删除项，返回是否删除成功 |
| `.clear()` | 清空所有项 |
| `.keys()` | 返回键迭代器 |
| `.values()` | 返回值迭代器（跳过过期项） |
| `.size` | 当前条目数（getter） |

```ts
import { LRUCache } from '@cat-kit/be'

const cache = new LRUCache<string, UserData>({ maxSize: 500, ttl: 5 * 60 * 1000 })

cache.set('user:1', userData)
cache.set('user:2', otherData, 60_000) // 覆盖全局 TTL，1 分钟过期

const user = cache.get('user:1') // 命中，更新 LRU 顺序
```

## FileCache

```ts
class FileCache<V> {
  constructor(options: FileCacheOptions)
}

interface FileCacheOptions {
  dir: string          // 缓存目录
  ttl?: number         // 全局 TTL（ms）
  extension?: string   // 文件扩展名，默认 '.json'
}
```

基于文件系统的持久化缓存。键通过 `encodeURIComponent` 编码后作为文件名。值为 JSON 序列化存储。

| 方法 | 说明 |
|------|------|
| `.get(key)` | 从文件读取值，过期自动删除文件返回 undefined |
| `.set(key, value, ttl?)` | 写入文件 |
| `.delete(key)` | 删除文件 |
| `.clear()` | 删除并重建整个缓存目录 |

```ts
import { FileCache } from '@cat-kit/be'

const cache = new FileCache<ApiResponse>({
  dir: './cache/api',
  ttl: 30 * 60 * 1000  // 30 分钟
})

const cached = await cache.get('users:list')
if (cached) return cached

const data = await fetchUsers()
await cache.set('users:list', data)
```

## memoize

```ts
function memoize<F extends (...args: any[]) => any>(
  fn: F,
  options?: MemoizeOptions<F>
): F & { cache: CacheAdapter; clear(): void }

interface MemoizeOptions<F> {
  cache?: CacheAdapter     // 默认 new LRUCache()
  resolver?: (...args: Parameters<F>) => string  // 自定义缓存键生成器
  ttl?: number             // TTL（ms）
}
```

函数记忆化。默认用参数 `JSON.stringify` 作为缓存键，单参数用 `String()`。异步函数缓存 Promise 的 resolved 值。

```ts
import { memoize } from '@cat-kit/be'

// 同步函数
const fib = memoize((n: number): number => {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
})
console.log(fib(40)) // 瞬时完成

// 异步函数
const fetchUser = memoize(async (id: number) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}, { ttl: 60_000 })

await fetchUser(1)  // 网络请求
await fetchUser(1)  // 命中缓存

fetchUser.clear()    // 手动清缓存
```

> 类型签名：`../../generated/be/cache/`
