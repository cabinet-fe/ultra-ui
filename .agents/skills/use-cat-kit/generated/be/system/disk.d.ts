//#region src/system/disk.d.ts
/**
 * 磁盘信息
 */
interface DiskInfo {
  /** 磁盘路径 */
  path: string;
  /** 总容量（字节） */
  total: number;
  /** 空闲容量（字节） */
  free: number;
  /** 已用容量（字节） */
  used: number;
  /** 使用率（百分比） */
  usedPercent: number;
}
/**
 * 获取指定路径所在磁盘的容量信息
 *
 * 支持 Windows 和 Unix 系统。Windows 使用 PowerShell 查询，Unix 使用 `statfs`。
 *
 * @param path - 目标路径，默认使用当前工作目录
 * @returns 磁盘容量、剩余与使用信息
 * @throws {Error} 当无法获取磁盘信息时抛出错误
 */
declare function getDiskInfo(path?: string): Promise<DiskInfo>;
//#endregion
export { DiskInfo, getDiskInfo };
//# sourceMappingURL=disk.d.ts.map