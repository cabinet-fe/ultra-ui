//#region src/file/read.d.ts
interface ReadChunksOptions {
  /** 每次读取的块大小，默认 10MB */
  chunkSize?: number;
  /** 开始读取的偏移量 */
  offset?: number;
}
/**
 * 分块读取文件，返回 AsyncGenerator
 *
 * 使用 Blob.slice() + arrayBuffer() 替代 FileReader，
 * 支持 for-await-of 遍历、break 提前退出
 *
 * @param file 要读取的文件或 Blob 对象
 * @param options 读取配置
 *
 * @example
 * ```ts
 * for await (const chunk of readChunks(file)) {
 *   hash.update(chunk)
 * }
 * ```
 *
 * @example
 * ```ts
 * // 手动控制
 * const reader = readChunks(file, { chunkSize: 1024 * 1024 })
 * const { value, done } = await reader.next()
 * await reader.return(undefined)
 * ```
 */
declare function readChunks(file: Blob | File, options?: ReadChunksOptions): AsyncGenerator<Uint8Array>;
//#endregion
export { ReadChunksOptions, readChunks };
//# sourceMappingURL=read.d.ts.map