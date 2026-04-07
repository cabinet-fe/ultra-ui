//#region src/cache/memoize.d.ts
/**
 * 缓存适配器接口
 *
 * 用于自定义缓存实现，支持不同的缓存策略。
 *
 * @template K 键的类型
 * @template V 值的类型
 */
interface CacheAdapter<K, V> {
  /** 获取缓存值 */
  get(key: K): V | undefined;
  /** 设置缓存值 */
  set(key: K, value: V, ttl?: number): void;
  /** 检查键是否存在 */
  has(key: K): boolean;
  /** 删除缓存项 */
  delete(key: K): boolean;
  /** 清空所有缓存 */
  clear(): void;
}
/**
 * 函数记忆化选项
 *
 * @template F 函数类型
 * @template K 缓存键类型
 */
interface MemoizeOptions<F extends (...args: any[]) => any, K> {
  /** 自定义缓存实现，默认使用 LRUCache */
  cache?: CacheAdapter<K, Awaited<ReturnType<F>>>;
  /** 自定义键解析函数，默认使用 JSON.stringify */
  resolver?: (...args: Parameters<F>) => K;
  /** 默认过期时间（毫秒） */
  ttl?: number;
}
/**
 * 为函数添加缓存能力（记忆化）
 *
 * 自动缓存函数调用结果，相同参数的后续调用会直接返回缓存值。
 * 支持同步和异步函数，异步函数会缓存 Promise 结果。
 *
 * @example
 * ```typescript
 * // 同步函数
 * const expensiveFn = memoize((n: number) => {
 *   // 复杂计算
 *   return n * n
 * })
 *
 * // 异步函数
 * const fetchUser = memoize(async (id: number) => {
 *   return await api.getUser(id)
 * }, { ttl: 3600000 })
 *
 * // 访问缓存
 * expensiveFn.cache.get('1') // 获取缓存值
 * expensiveFn.clear() // 清空缓存
 * ```
 *
 * @param fn - 需要缓存的原函数
 * @param options - 自定义缓存、键解析与过期时间
 * @returns 带缓存功能的函数，并附带 `cache` 和 `clear` 属性
 * @template F 函数类型
 */
declare function memoize<F extends (...args: any[]) => any>(fn: F, options?: MemoizeOptions<F, unknown>): F & {
  cache: CacheAdapter<unknown, Awaited<ReturnType<F>>>;
  clear(): void;
};
//#endregion
export { CacheAdapter, MemoizeOptions, memoize };
//# sourceMappingURL=memoize.d.ts.map