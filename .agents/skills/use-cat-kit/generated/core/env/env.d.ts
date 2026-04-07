//#region src/env/env.d.ts
/**
 * 获取当前运行环境
 *
 * 通过 `globalThis` 探测，避免直接引用未声明的全局。判定顺序：
 * 1. 若存在 `globalThis.window`（含 `undefined` 以外的占位），视为 `browser`。
 * 2. 否则若存在 `globalThis.process`，视为 `node`。
 *
 * 因此 Electron 等同时存在 `window` 与 Node `process` 时结果为 `browser`。若未来改为优先 `process`，属 breaking，须 major 与迁移说明。
 *
 * @returns 'browser' | 'node' | 'unknown'
 */
declare function getRuntime(): 'browser' | 'node' | 'unknown';
/**
 * 判断是否在浏览器中运行
 * @returns 是否在浏览器中运行
 */
declare function isInBrowser(): boolean;
/**
 * 判断是否在node环境中运行
 * @returns 是否在node环境中运行
 */
declare function isInNode(): boolean;
/**
 * 操作系统类型
 */
type OSType = 'Windows' | 'Linux' | 'MacOS' | 'Android' | 'iOS' | 'Unknown';
/**
 * 获取操作系统类型
 * @returns 操作系统类型
 */
declare function getOSType(): OSType;
/**
 * 设备类型
 */
type DeviceType = 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown';
/**
 * 获取设备类型
 * @returns 设备类型
 */
declare function getDeviceType(): DeviceType;
/**
 * 浏览器类型
 */
type BrowserType = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'IE' | 'Opera' | 'Unknown';
/**
 * 获取浏览器类型
 * @returns 浏览器类型
 */
declare function getBrowserType(): BrowserType;
/**
 * 获取浏览器版本
 * @returns 浏览器版本号或 null
 */
declare function getBrowserVersion(): string | null;
/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
declare function isMobile(): boolean;
/**
 * 检查是否为平板设备
 * @returns 是否为平板设备
 */
declare function isTablet(): boolean;
/**
 * 检查是否为桌面设备
 * @returns 是否为桌面设备
 */
declare function isDesktop(): boolean;
/**
 * 检查是否支持触摸事件
 * @returns 是否支持触摸事件
 */
declare function isTouchDevice(): boolean;
/**
 * 获取 Node.js 版本
 * @returns Node.js 版本或 null
 */
declare function getNodeVersion(): string | null;
type EnvironmentSummary = {
  runtime: 'browser';
  os: OSType;
  browser: BrowserType;
  browserVersion: string | null;
  device: DeviceType;
  touchSupported: boolean;
} | {
  runtime: 'node';
  os: OSType;
  nodeVersion: string | null;
} | {
  runtime: 'unknown';
  os: OSType;
};
/**
 * 获取环境信息摘要
 * @returns 环境信息对象
 */
declare function getEnvironmentSummary(): EnvironmentSummary;
//#endregion
export { BrowserType, DeviceType, EnvironmentSummary, OSType, getBrowserType, getBrowserVersion, getDeviceType, getEnvironmentSummary, getNodeVersion, getOSType, getRuntime, isDesktop, isInBrowser, isInNode, isMobile, isTablet, isTouchDevice };
//# sourceMappingURL=env.d.ts.map