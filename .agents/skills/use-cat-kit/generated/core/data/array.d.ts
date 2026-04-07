//#region src/data/array.d.ts
type Last<T> = T extends [...any, infer L] ? L : T extends (infer P)[] ? P : undefined;
/**
 * 获取数组最后一位
 * @param arr 数组
 */
declare function last<T extends any[]>(arr: [...T]): Last<T>;
declare function last<T extends any[]>(arr: readonly [...T]): Last<T>;
/**
 * 合并多个数组并去重
 * @param arrList 任意多个数组
 */
declare function union<T>(...arrList: T[][]): T[];
/**
 * 合并多个对象数组，并指定去重字段
 * @param key 按照这个字段进行去重
 * @param arrList 任意多个数组
 */
declare function unionBy<T extends Record<string, any>>(key: string, ...arrList: T[][]): T[];
/**
 * 数组从右到左的回调
 * @param arr 数组
 * @param cb 回调
 */
declare function eachRight<T>(arr: T[], cb: (v: T, i: number, arr: T[]) => void): void;
/**
 * 丢弃数组中指定的索引的元素
 * @param arr 数组
 * @param indexes 索引或者索引列表
 */
declare function omitArr<T>(arr: T[], indexes: number | number[]): T[];
declare class Arr<T> {
  private _source;
  constructor(arr: T[]);
  /**
   * 从右往左遍历
   * @param cb 回调
   */
  eachRight(cb: (v: T, i: number, arr: T[]) => void): void;
  /**
   * 丢弃元素
   * @param index 索引
   * @returns
   */
  omit(index: number | number[]): T[];
  /**
   * 查询
   * @param condition 查询条件
   * @returns
   */
  find(condition: Record<string, any>): T | undefined;
  /** 最后一个元素 */
  get last(): T | undefined;
  /**
   * 移动元素至某个新的位置
   * @param from 原索引
   * @param to 目标索引
   * @returns
   */
  move(from: number, to: number): T[];
  /**
   * 分组，返回一个对象，key为分组的值，value为分组的元素
   * @param cb 分组回调, 返回值为分组的值
   * @returns 分组后的对象
   */
  groupBy<K extends string | number>(cb: (item: T) => K): Record<K, T[]>;
}
declare function arr<T>(arr: T[]): Arr<T>;
//#endregion
export { arr, eachRight, last, omitArr, union, unionBy };
//# sourceMappingURL=array.d.ts.map