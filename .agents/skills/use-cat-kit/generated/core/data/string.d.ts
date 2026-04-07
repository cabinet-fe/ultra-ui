//#region src/data/string.d.ts
declare class CatString {
  private raw;
  constructor(str: string);
  /**
   * 将字符串转换为驼峰命名
   * @param type 驼峰类型：'lower'为小驼峰(lowerCamelCase)，'upper'为大驼峰(UpperCamelCase)
   * @returns 驼峰命名后的字符串
   * @example
   * ```ts
   * str('hello-world').camelCase() // 'helloWorld'
   * str('hello-world').camelCase('upper') // 'HelloWorld'
   * ```
   */
  camelCase(type?: 'lower' | 'upper'): string;
  /**
   * 将字符串转换为连字符命名(kebab-case)
   * @returns 连字符命名后的字符串
   * @example
   * ```ts
   * str('helloWorld').kebabCase() // 'hello-world'
   * ```
   */
  kebabCase(): string;
}
/**
 * 创建一个字符串操作对象
 * @param str 需要操作的字符串
 * @returns 字符串操作对象
 * @example
 * ```ts
 * const s = str('hello-world')
 * s.camelCase() // 'helloWorld'
 * s.kebabCase() // 'hello-world'
 * ```
 */
declare function str(str: string): CatString;
declare const $str: {
  /**
   * 拼接URL路径
   * @param firstPath 第一个路径
   * @param paths 需要拼接的路径
   * @returns 拼接后的路径
   * @example
   * ```ts
   * $str.joinUrlPath('https://example.com', 'path', 'to', 'resource') // 'https://example.com/path/to/resource'
   * ```
   */
  joinUrlPath(firstPath: string, ...paths: string[]): string;
};
//#endregion
export { $str, str };
//# sourceMappingURL=string.d.ts.map