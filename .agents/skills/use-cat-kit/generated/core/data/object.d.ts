//#region src/data/object.d.ts
declare class CatObject<O extends Record<string, any>, K extends keyof O = keyof O> {
  readonly raw: O;
  constructor(object: O);
  /**
   * 获取对象的所有键
   * @returns 对象的键组成的元组类型
   */
  keys(): string[];
  /**
   * 遍历对象
   * @param callback 回调，第一个参数是对象key，第二个参数是key对应的value
   * @returns 当前对象
   */
  each(callback: (key: string, value: any) => void): CatObject<O, K>;
  /**
   * 挑选对象的key，生成新的对象
   * @param keys 需要挑选的key
   * @returns 新的对象
   */
  pick<KK extends K>(keys: KK[]): Pick<O, KK>;
  /**
   * 忽略对象的key，生成新的对象
   * @param keys 需要忽略的key
   * @returns 新的对象
   */
  omit<KK extends K>(keys: KK[]): Omit<O, KK>;
  /**
   * 从其他对象中继承属性，只继承当前对象中存在的属性
   * @param source 继承的目标
   * @returns 当前对象
   */
  extend(source: Record<string, any>[] | Record<string, any>): O;
  /**
   * 从其他对象中深度继承属性，只继承当前对象中存在的属性
   * @param source 继承的目标
   * @returns 当前对象
   */
  deepExtend(source: Record<string, any>[] | Record<string, any>): O;
  /**
   * 结构化拷贝
   * @description 注意，如果对象中存在函数，则函数不会被拷贝
   * @returns 新的对象
   */
  copy(): O;
  private static merge;
  /**
   * 将其他对象合并到当前对象
   * @param source 需要合并的对象
   * @returns 当前对象
   */
  merge(source: Record<string, any>[] | Record<string, any>): O;
  /**
   * 获取对象的值
   *
   * @param prop 需要获取的属性, 可以是链式的属性
   *
   * @returns 值
   */
  get<T extends any = any>(prop: string): T | undefined;
  /**
   * 设置对象的值
   * @param prop 需要设置的属性
   * @param value 需要设置的值
   * @returns 当前对象
   */
  set(prop: string, value: any): Record<string, any>;
}
declare function o<O extends Record<string, any>>(object: O): CatObject<O>;
//#endregion
export { o };
//# sourceMappingURL=object.d.ts.map