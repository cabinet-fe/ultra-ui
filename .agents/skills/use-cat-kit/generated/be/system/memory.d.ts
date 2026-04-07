//#region src/system/memory.d.ts
/**
 * 内存信息
 */
interface MemoryInfo {
  /** 总内存（字节） */
  total: number;
  /** 空闲内存（字节） */
  free: number;
  /** 已用内存（字节） */
  used: number;
  /** 内存使用率（百分比） */
  usedPercent: number;
}
/**
 * 获取系统内存使用情况
 *
 * @returns 总量、空闲、已用及使用率
 */
declare function getMemoryInfo(): MemoryInfo;
//#endregion
export { MemoryInfo, getMemoryInfo };
//# sourceMappingURL=memory.d.ts.map