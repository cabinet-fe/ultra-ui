import { ClientPlugin, RequestMethod } from "../types.js";

//#region src/plugins/method-override.d.ts
/**
 * 方法重写插件配置
 */
interface MethodOverridePluginOptions {
  /**
   * 需要被重写的请求方法
   * - 默认为 ['DELETE', 'PUT', 'PATCH']
   */
  methods?: RequestMethod[];
  /**
   * 重写后的请求方法
   * - 默认为 'POST'
   */
  overrideMethod?: RequestMethod;
  /**
   * 方法覆盖请求头名称
   * - 默认为 'X-HTTP-Method-Override'
   */
  headerName?: string;
}
/**
 * 方法重写插件
 *
 * 用于绕过某些环境对特定 HTTP 方法的限制
 *
 * @example
 * ```ts
 * import { MethodOverridePlugin, HTTPClient } from '@cat-kit/http'
 * const http = new HTTPClient('', {
 *   plugins: [
 *     MethodOverridePlugin()
 *   ]
 * })
 * ```
 */
declare function MethodOverridePlugin(options?: MethodOverridePluginOptions): ClientPlugin;
//#endregion
export { MethodOverridePlugin, MethodOverridePluginOptions };
//# sourceMappingURL=method-override.d.ts.map