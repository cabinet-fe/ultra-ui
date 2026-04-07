//#region src/fs/json.d.ts
/**
 * 读取 JSON 文件选项
 */
interface ReadJsonOptions {
  /** 文件编码，默认 'utf8' */
  encoding?: BufferEncoding;
  /** JSON.parse 的 reviver 函数 */
  reviver?: Parameters<typeof JSON.parse>[1];
}
/**
 * 写入 JSON 文件选项
 */
interface WriteJsonOptions {
  /** 文件编码，默认 'utf8' */
  encoding?: BufferEncoding;
  /** JSON.stringify 的 replacer 函数 */
  replacer?: Parameters<typeof JSON.stringify>[1];
  /** 缩进空格数，默认 2 */
  space?: Parameters<typeof JSON.stringify>[2];
  /** 文件末尾换行符，默认 '\n' */
  eol?: string;
}
/**
 * 读取 JSON 文件并解析为对象
 *
 * @example
 * ```typescript
 * // 读取配置文件
 * const config = await readJson<AppConfig>('./config.json')
 *
 * // 使用 reviver 转换日期
 * const data = await readJson('./data.json', {
 *   reviver: (key, value) => {
 *     if (key === 'date') return new Date(value)
 *     return value
 *   }
 * })
 * ```
 *
 * @param filePath - JSON 文件路径
 * @param options - 读取编码与自定义 reviver
 * @returns 解析后的数据
 * @throws {Error} 当文件不存在或 JSON 格式错误时抛出错误
 * @template T 返回数据类型
 */
declare function readJson<T = Record<string, any>>(filePath: string, options?: ReadJsonOptions): Promise<T>;
/**
 * 将数据序列化为 JSON 文件
 *
 * 如果目录不存在会自动创建。文件末尾会自动添加换行符。
 *
 * @example
 * ```typescript
 * // 写入配置文件
 * await writeJson('./config.json', {
 *   port: 3000,
 *   debug: false
 * })
 *
 * // 自定义格式
 * await writeJson('./data.json', data, {
 *   space: 4,
 *   eol: '\r\n'
 * })
 * ```
 *
 * @param filePath - 目标文件路径
 * @param data - 待写入的数据
 * @param options - 编码、replacer、缩进等选项
 * @throws {Error} 当文件写入失败时抛出错误
 */
declare function writeJson(filePath: string, data: unknown, options?: WriteJsonOptions): Promise<void>;
//#endregion
export { ReadJsonOptions, WriteJsonOptions, readJson, writeJson };
//# sourceMappingURL=json.d.ts.map