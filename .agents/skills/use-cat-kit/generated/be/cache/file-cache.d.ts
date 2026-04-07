//#region src/cache/file-cache.d.ts
/**
 * 文件缓存选项
 */
interface FileCacheOptions {
  /** 缓存目录路径 */
  dir: string;
  /**
   * 默认过期时间（毫秒）
   */
  ttl?: number;
  /**
   * 文件后缀
   * @default '.json'
   */
  extension?: string;
}
/**
 * 基于文件系统的缓存实现
 *
 * 将缓存数据持久化到文件系统，支持 TTL 过期机制。
 *
 * @example
 * ```typescript
 * const cache = new FileCache<User>({
 *   dir: './cache',
 *   ttl: 3600000 // 1小时过期
 * })
 *
 * await cache.set('user:1', user)
 * const user = await cache.get('user:1')
 * ```
 *
 * @template V 缓存值的类型
 */
declare class FileCache<V> {
  private readonly dir;
  private readonly ttl?;
  private readonly extension;
  /**
   * 创建文件缓存实例
   * @param options - 缓存选项
   */
  constructor(options: FileCacheOptions);
  private getFilePath;
  private isExpired;
  /**
   * 获取缓存值
   *
   * 如果值已过期或不存在，返回 `undefined`。过期的缓存文件会被自动删除。
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 `undefined`
   * @throws {Error} 当文件读取失败时抛出错误
   */
  get(key: string): Promise<V | undefined>;
  /**
   * 设置缓存值
   *
   * 如果目录不存在会自动创建。值会被序列化为 JSON 并写入文件。
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），如果未指定则使用默认 TTL
   * @throws {Error} 当文件写入失败时抛出错误
   */
  set(key: string, value: V, ttl?: number): Promise<void>;
  /**
   * 删除指定的缓存项
   *
   * @param key - 要删除的缓存键
   * @returns 如果键存在并成功删除返回 `true`，如果文件不存在返回 `false`
   * @throws {Error} 当文件删除失败时抛出错误
   */
  delete(key: string): Promise<boolean>;
  /**
   * 清空所有缓存项
   *
   * 删除整个缓存目录并重新创建。
   *
   * @throws {Error} 当目录操作失败时抛出错误
   */
  clear(): Promise<void>;
}
//#endregion
export { FileCache, FileCacheOptions };
//# sourceMappingURL=file-cache.d.ts.map