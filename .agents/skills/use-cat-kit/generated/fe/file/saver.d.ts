//#region src/file/saver.d.ts
/**
 * 通过 Blob 保存文件
 *
 * 适用于小到中等大小的文件（通常 < 500MB）
 * 使用传统的 Object URL + a[download] 方式
 *
 * @example
 * ```ts
 * const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
 * saveBlob(blob, 'hello.txt')
 * ```
 */
declare function saveBlob(blob: Blob, filename: string): void;
//#endregion
export { saveBlob };
//# sourceMappingURL=saver.d.ts.map