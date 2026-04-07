//#region src/fs/empty-dir.d.ts
/**
 * 确保目录为空
 *
 * 如果目录不为空，则删除目录内容。如果目录不存在，则创建该目录。
 * 目录本身不会被删除。
 *
 * @example
 * ```typescript
 * // 确保目录为空
 * await emptyDir('./temp')
 *
 * // 清空缓存目录
 * await emptyDir('./cache')
 *
 * // 如果目录不存在，会自动创建
 * await emptyDir('./new-empty-dir')
 * ```
 *
 * @param dirPath - 目标目录路径
 * @throws {Error} 当路径存在但不是目录时抛出错误
 * @throws {Error} 当目录操作失败时抛出错误
 */
declare function emptyDir(dirPath: string): Promise<void>;
//#endregion
export { emptyDir };
//# sourceMappingURL=empty-dir.d.ts.map