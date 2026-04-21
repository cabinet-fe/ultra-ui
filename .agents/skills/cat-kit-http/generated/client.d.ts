import {
  AliasRequestConfig,
  ClientConfig,
  HTTPClientPlugin,
  HTTPResponse,
  RequestConfig
} from './types.js'

//#region src/client.d.ts
/** 插件触发的单次请求最多允许的重试次数（retryCount 0 为首次，共最多 11 次尝试） */
declare const MAX_PLUGIN_RETRIES = 10
/**
 * 合并请求配置：headers / query 做对象级合并；标量类字段仅在 patch 显式传入且非 undefined 时覆盖。
 * `undefined` 不用于清空已有配置。
 */
declare function mergeRequestConfig(base: RequestConfig, patch: RequestConfig): RequestConfig
/**
 * HTTP 请求客户端
 *
 * 提供了一个符合人体工学的，跨端(node 和浏览器)的 HTTP 请求客户端。
 * 支持插件系统，可以灵活地组合和增强请求客户端。
 *
 * @example
 * ```ts
 * import { HTTPClient } from '@cat-kit/http'
 *
 * const http = new HTTPClient('/api', {
 *   origin: 'http://localhost:8080',
 *   timeout: 30 * 1000
 * })
 *
 * // 发起请求
 * http.request('/user', { method: 'get' }).then(res => {
 *   // ...do some things
 * })
 *
 * // 请求别名
 * http.get('/user', { query: { name: 'Zhang San' } }).then(res => {
 *   // ...do some things
 * })
 * ```
 */
declare class HTTPClient {
  /** 请求前缀 */
  private prefix
  /** 客户端配置 */
  private config
  /** 请求引擎 */
  private engine
  /** 父 client（仅由 group() 内部赋值；根 client 为 undefined） */
  private parent?
  /** 当前 client 自身持有的插件列表（不含父链继承） */
  private ownPlugins
  /**
   * 创建 HTTP 客户端实例
   * @param prefix 请求前缀
   * @param config 客户端配置
   */
  constructor(prefix?: string, config?: ClientConfig)
  /**
   * 计算当前 client 在运行时生效的插件列表：父链在前、子在后
   */
  private getEffectivePlugins
  /**
   * 注册插件（运行时动态装配）
   * - 插件必须拥有非空字符串 `name`，否则抛 HTTPError({ code: 'PLUGIN' })
   * - 插件名在 client 自身及其父链范围内必须唯一，冲突时抛 HTTPError({ code: 'PLUGIN' })
   */
  registerPlugin(plugin: HTTPClientPlugin): void
  private registerPluginInternal
  private getRequestUrl
  private isAbsoluteUrl
  private appendQueryParams
  /**
   * 获取请求配置
   * @param config 当前请求配置
   * @returns 合并后的请求配置
   */
  private getRequestConfig
  private runOnErrorPlugins
  private _executeRequest
  /**
   * 发送 HTTP 请求
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<HTTPResponse>
   */
  request<T = any>(url: string, config?: RequestConfig): Promise<HTTPResponse<T>>
  /**
   * 发送 GET 请求
   * @param url 请求地址
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  get<T>(url: string, config?: AliasRequestConfig): Promise<HTTPResponse<T>>
  /**
   * 发送 POST 请求
   * @param url 请求地址
   * @param body 请求体
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  post<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  /**
   * 发送 PUT 请求
   * @param url 请求地址
   * @param body 请求体
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  put<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  /**
   * 发送 DELETE 请求
   * @param url 请求地址
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  delete<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  /**
   * 发送 PATCH 请求
   * @param url 请求地址
   * @param body 请求体
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  patch<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  /**
   * 发送 HEAD 请求
   * @param url 请求地址
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  head<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  /**
   * 发送 OPTIONS 请求
   * @param url 请求地址
   * @param config 请求选项
   * @returns Promise<HTTPResponse>
   */
  options<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  /**
   * 中止所有请求
   */
  abort(): void
  /**
   * 创建请求分组
   * @param prefix 分组前缀
   * @returns HTTPClient 新的客户端实例
   *
   * 插件继承语义：
   * - 子 client 通过父链继承插件；父后续 `registerPlugin` 会自动反映到子（父影响子）
   * - 子 `registerPlugin` 仅改动 `child.ownPlugins`（子不影响父）
   * - 同名校验跨父子层级生效
   *
   * 注意：父子共享同一 `engine` 实例，`abort()` 会中止父或子任意一方触发该引擎的所有在途请求。
   *
   * @example
   * ```ts
   * const http = new HTTPClient()
   * const userGroup = http.group('/user')
   *
   * // 等同于 http.get('/user/profile')
   * userGroup.get('/profile')
   *
   * // 中止分组中的所有请求
   * userGroup.abort()
   * ```
   */
  group(prefix: string): HTTPClient
}
//#endregion
export { HTTPClient, MAX_PLUGIN_RETRIES, mergeRequestConfig }
