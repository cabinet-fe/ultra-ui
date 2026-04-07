//#region src/cache/lru-cache.d.ts
/**
 * LRU 缓存选项
 */
interface LRUCacheOptions {
  /**
   * 最大缓存容量
   * @default 100
   */
  maxSize?: number;
  /**
   * 默认过期时间（毫秒）
   */
  ttl?: number;
}
/**
 * LRU（最近最少使用）缓存实现
 *
 * 自动淘汰最久未使用的项，支持 TTL（生存时间）过期机制
 *
 * @example
 * ```typescript
 * const cache = new LRUCache<string, User>({
 *   maxSize: 100,
 *   ttl: 3600000 // 1小时过期
 * })
 *
 * cache.set('user:1', user)
 * const user = cache.get('user:1')
 * ```
 *
 * @template K 键的类型
 * @template V 值的类型
 */
declare class LRUCache<K, V> {
  private readonly cache;
  private readonly maxSize;
  private readonly ttl?;
  /**
   * 创建 LRU 缓存实例
   * @param options - 缓存选项
   */
  constructor(options?: LRUCacheOptions);
  private isExpired;
  private touch;
  /**
   * 获取缓存值
   *
   * 如果值已过期或不存在，返回 `undefined`。访问时会自动更新使用顺序。
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 `undefined`
   */
  get(key: K): V | undefined;
  /**
   * 检查键是否存在且未过期
   *
   * @param key - 缓存键
   * @returns 如果键存在且未过期返回 `true`，否则返回 `false`
   */
  has(key: K): boolean;
  /**
   * 设置缓存值
   *
   * 如果缓存已满，会自动删除最久未使用的项。如果键已存在，会更新其值和使用时间。
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），如果未指定则使用默认 TTL
   */
  set(key: K, value: V, ttl?: number): void;
  /**
   * 删除指定的缓存项
   *
   * @param key - 要删除的缓存键
   * @returns 如果键存在并成功删除返回 `true`，否则返回 `false`
   */
  delete(key: K): boolean;
  /**
   * 清空所有缓存项
   */
  clear(): void;
  /**
   * 获取所有缓存键的迭代器
   *
   * @returns 键的迭代器
   */
  keys(): IterableIterator<K>;
  /**
   * 获取所有缓存值的迭代器
   *
   * 只返回未过期的值。
   *
   * @returns 值的迭代器
   */
  values(): IterableIterator<V>;
  /**
   * 获取当前缓存中的条目数量
   * @returns 缓存条目数量
   */
  get size(): number;
}
//#endregion
export { LRUCache, LRUCacheOptions };
//# sourceMappingURL=lru-cache.d.ts.map