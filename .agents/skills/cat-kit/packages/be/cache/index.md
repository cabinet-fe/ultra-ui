# be — 缓存

## 何时使用

进程内 LRU、磁盘文件缓存，或函数结果记忆化。

## 推荐公开 API

`LRUCache`、`FileCache`、`memoize`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- LRU `ttl: 0` 表示不过期；FileCache `ttl: 0` 立即过期
- `FileCache.delete()` 对缺失键也可能返回 `true`（实现调用强制删除）
- `memoize`：单参用 `String(arg)`，多参 `JSON.stringify`；异步结果在 fulfilled 后缓存；并发相同调用不合并；拒绝结果不缓存

## 类型入口

[lru-cache.d.ts](../../../generated/be/cache/lru-cache.d.ts) · [file-cache.d.ts](../../../generated/be/cache/file-cache.d.ts) · [memoize.d.ts](../../../generated/be/cache/memoize.d.ts)
