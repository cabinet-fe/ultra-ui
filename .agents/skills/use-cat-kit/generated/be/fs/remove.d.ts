//#region src/fs/remove.d.ts
interface RemoveOptions {
  /**
   * 是否忽略不存在的路径
   * @default false
   */
  force?: boolean;
}
/**
 * 删除文件或目录
 * @param targetPath - 要删除的路径
 * @param options - 删除行为控制（是否忽略不存在）
 */
declare function removePath(targetPath: string, options?: RemoveOptions): Promise<void>;
//#endregion
export { RemoveOptions, removePath };
//# sourceMappingURL=remove.d.ts.map