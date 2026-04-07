//#region src/storage/storage.d.ts
type Callback<T = any> = (key: StorageKey<T>, value?: T, temp?: {
  value: T;
  exp: number;
}) => void;
type StorageKey<_> = {};
declare function storageKey<T>(str: string): StorageKey<T>;
type ExtractStorageKey<T> = T extends StorageKey<infer K> ? K : never;
declare class WebStorage {
  static enabledType: Set<string>;
  private storage;
  callbacks: {
    [key: string]: Callback[];
  };
  constructor(storage: Storage);
  /**
   * 往缓存里添加单条记录
   * @param key 单个值的键
   * @param value 单个值
   * @param exp 单个值的过期时间, 单位秒
   */
  set<T>(key: StorageKey<T>, value: T, exp?: number): WebStorage;
  get<T>(key: StorageKey<T>): T | null;
  get<T>(key: StorageKey<T>, defaultValue: T): T;
  get<T extends [...any[]]>(keys: [...T]): { [I in keyof T]: ExtractStorageKey<T[I]> };
  /**
   * 获取字段过期时间
   * @param key 字段名
   */
  getExpire(key: StorageKey<any>): number;
  /**
   * 移除一个缓存值
   * @param key 需要移除的值的键
   */
  remove(key: StorageKey<any>): WebStorage;
  /**
   * 移除多个缓存值
   * @param keys 需要移除的值的键的数组
   */
  remove(keys: StorageKey<any>[]): WebStorage;
  /**
   * 清空缓存
   */
  remove(): WebStorage;
  /**
   * 添加一个值改动的回调
   * @param key 键
   * @param callback 回调函数
   */
  on(key: string, callback: Callback): void;
  /**
   * 移除多个回调
   * @param keys 需要移除的回调的字符串数组
   */
  off(keys: string[]): void;
  /**
   * 移除单个回调
   * @param key 需要移除的记录的键
   */
  off(key: string): void;
  /**
   * 移除所有回调
   */
  off(): void;
}
declare const storage: {
  readonly local: WebStorage;
  readonly session: WebStorage;
};
//#endregion
export { ExtractStorageKey, StorageKey, storage, storageKey };
//# sourceMappingURL=storage.d.ts.map