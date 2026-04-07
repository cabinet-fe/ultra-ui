//#region src/fs/ensure-dir.d.ts
/**
 * 确保目录存在
 *
 * 如果目录不存在则创建，包括所有父目录。如果路径已存在但不是目录，会抛出错误。
 *
 * @example
 * ```typescript
 * // 确保目录存在
 * await ensureDir('./logs/app')
 *
 * // 创建嵌套目录
 * await ensureDir('./data/2024/01')
 * ```
 *
 * @param dirPath - 目标目录路径
 * @throws {Error} 当路径存在但不是目录时抛出错误
 * @throws {Error} 当目录创建失败时抛出错误
 */
declare function ensureDir(dirPath: string): Promise<void>;
//#endregion
export { ensureDir };
//# sourceMappingURL=ensure-dir.d.ts.map