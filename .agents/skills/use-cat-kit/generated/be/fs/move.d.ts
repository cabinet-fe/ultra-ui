//#region src/fs/move.d.ts
/**
 * 移动路径选项
 */
interface MoveOptions {
  /**
   * 如果目标路径已存在，是否覆盖
   * @default false
   */
  overwrite?: boolean;
}
/**
 * 移动文件或目录到新位置
 *
 * 将源路径的文件或目录移动到目标路径。源路径和目标路径类型必须一致：
 * 要么都是文件，要么都是目录。
 *
 * @example
 * ```typescript
 * // 移动文件
 * await movePath('./old/file.txt', './new/file.txt')
 *
 * // 移动目录
 * await movePath('./old-dir', './new-dir')
 *
 * // 覆盖已存在的目标
 * await movePath('./source', './target', { overwrite: true })
 * ```
 *
 * @param src - 源路径（文件或目录）
 * @param dest - 目标路径（必须与源路径类型一致）
 * @param options - 移动选项
 * @throws {Error} 当源路径不存在时抛出错误
 * @throws {Error} 当源路径和目标路径类型不一致时抛出错误
 * @throws {Error} 当目标路径已存在且 overwrite 为 false 时抛出错误
 */
declare function movePath(src: string, dest: string, options?: MoveOptions): Promise<void>;
//#endregion
export { MoveOptions, movePath };
//# sourceMappingURL=move.d.ts.map