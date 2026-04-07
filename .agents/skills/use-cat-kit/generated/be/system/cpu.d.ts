//#region src/system/cpu.d.ts
/**
 * CPU 基本信息
 */
interface CpuInfo {
  /** CPU 型号 */
  model: string;
  /** CPU 核心数 */
  cores: number;
  /** CPU 主频（MHz） */
  speed: number;
  /** 系统平均负载（1分钟、5分钟、15分钟） */
  loadAverage: [number, number, number];
}
/**
 * CPU 使用情况
 */
interface CpuUsage {
  /** 用户态时间（毫秒） */
  user: number;
  /** 系统态时间（毫秒） */
  system: number;
  /** 空闲时间（毫秒） */
  idle: number;
  /** 总时间（毫秒） */
  total: number;
  /** CPU 使用率（百分比） */
  percent: number;
}
/**
 * 获取 CPU 基本信息
 *
 * @returns CPU 型号、核心数、主频与平均负载
 */
declare function getCpuInfo(): CpuInfo;
/**
 * 采样 CPU 使用情况
 *
 * 通过采样一段时间内的 CPU 时间来计算使用率。
 *
 * @param interval - 采样间隔（毫秒），默认 500ms
 * @returns 采样区间内的 CPU 使用统计
 */
declare function getCpuUsage(interval?: number): Promise<CpuUsage>;
//#endregion
export { CpuInfo, CpuUsage, getCpuInfo, getCpuUsage };
//# sourceMappingURL=cpu.d.ts.map