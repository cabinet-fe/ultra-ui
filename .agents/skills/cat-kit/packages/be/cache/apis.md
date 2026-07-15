# 缓存 — API

```ts
declare class LRUCache<K, V> {
  constructor(options?: LRUCacheOptions)
  get(key: K): V | undefined
  set(key: K, value: V, ttl?: number): void
  has(key: K): boolean
  delete(key: K): boolean
  clear(): void
}

declare class FileCache<V> {
  constructor(options: FileCacheOptions) // dir, ttl?, extension?
  get(key: string): Promise<V | undefined>
  set(key: string, value: V, ttl?: number): Promise<void>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
}

declare function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: MemoizeOptions
): T & { cache: Map<string, any>; clear(): void }
```
