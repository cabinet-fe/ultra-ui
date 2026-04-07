import { Readable } from "node:stream";

//#region src/fs/write-file.d.ts
/**
 * 写入文件选项
 */
interface WriteFileOptions {
  /** 文件编码，默认 'utf8' */
  encoding?: BufferEncoding;
  /**
   * 文件权限模式，默认 0o666
   * @example 0o644
   */
  mode?: number;
  /**
   * 文件系统标志
   * - 'w': 写入（默认），如果文件存在则截断
   * - 'a': 追加，如果文件不存在则创建
   * - 'wx': 写入，如果文件存在则失败
   * @default 'w'
   */
  flag?: 'w' | 'a' | 'wx';
}
/**
 * 支持的写入数据类型
 */
type WriteFileData = string | Buffer | NodeJS.ArrayBufferView | ReadableStream<Uint8Array> | Readable | AsyncIterable<string | Buffer | NodeJS.ArrayBufferView> | Iterable<string | Buffer | NodeJS.ArrayBufferView>;
/**
 * 写入文件
 *
 * 相比 Node.js 原生 `fs.writeFile`，此函数提供以下增强功能：
 * - 自动创建父目录（如果不存在）
 * - 支持 Web ReadableStream（如 fetch 响应体）
 * - 支持 Node.js Readable 流
 * - 支持 AsyncIterable 和 Iterable
 *
 * @example
 * ```typescript
 * // 写入字符串
 * await writeFile('./logs/app.log', 'Hello World')
 *
 * // 写入 Buffer
 * await writeFile('./data/binary.dat', Buffer.from([0x00, 0x01, 0x02]))
 *
 * // 写入 Web ReadableStream（如 fetch 响应）
 * const response = await fetch('https://example.com/file')
 * await writeFile('./downloads/file.txt', response.body!)
 *
 * // 追加模式
 * await writeFile('./logs/app.log', 'New line\n', { flag: 'a' })
 *
 * // 指定编码
 * await writeFile('./data/utf16.txt', 'Unicode 文本', { encoding: 'utf16le' })
 * ```
 *
 * @param filePath - 目标文件路径
 * @param data - 要写入的数据
 * @param options - 写入选项
 * @throws {Error} 当写入失败时抛出错误
 */
declare function writeFile(filePath: string, data: WriteFileData, options?: WriteFileOptions): Promise<void>;
//#endregion
export { WriteFileData, WriteFileOptions, writeFile };
//# sourceMappingURL=write-file.d.ts.map