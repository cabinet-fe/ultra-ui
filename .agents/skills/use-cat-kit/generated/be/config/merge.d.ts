//#region src/config/merge.d.ts
type Mergeable = Record<string, any>;
/**
 * 深度合并多个配置对象
 *
 * 数组会被直接替换，对象会递归合并。返回新对象，不会修改原始对象。
 *
 * @example
 * ```typescript
 * const merged = mergeConfig(
 *   { a: 1, b: { c: 2 } },
 *   { b: { d: 3 }, e: 4 }
 * )
 * // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 *
 * @param configs - 待合并的配置对象集合，后面的会覆盖前面的
 * @returns 合并后的新对象
 * @template T 配置对象类型
 */
declare function mergeConfig<T extends Mergeable>(...configs: Array<Partial<T>>): T;
//#endregion
export { mergeConfig };
//# sourceMappingURL=merge.d.ts.map