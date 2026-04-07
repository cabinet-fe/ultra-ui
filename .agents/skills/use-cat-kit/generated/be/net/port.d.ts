//#region src/net/port.d.ts
/**
 * 端口检查选项
 */
interface PortCheckOptions {
  /** 主机地址，默认 '127.0.0.1' */
  host?: string;
  /** 超时时间（毫秒），默认 1000 */
  timeout?: number;
}
/**
 * 检查端口是否可用
 *
 * 通过尝试在该端口上创建服务器来判断端口是否被占用。
 *
 * @example
 * ```typescript
 * // 检查本地 3000 端口
 * const available = await isPortAvailable(3000)
 * if (available) {
 *   // 启动服务器
 * }
 *
 * // 检查指定主机的端口
 * const available = await isPortAvailable(8080, {
 *   host: '0.0.0.0',
 *   timeout: 2000
 * })
 * ```
 *
 * @param port - 目标端口号
 * @param options - 主机地址和超时时间选项
 * @returns 端口可用时返回 `true`，被占用或超时返回 `false`
 */
declare function isPortAvailable(port: number, options?: PortCheckOptions): Promise<boolean>;
//#endregion
export { PortCheckOptions, isPortAvailable };
//# sourceMappingURL=port.d.ts.map