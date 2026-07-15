import { HttpEngine } from './engine/engine.js'

//#region src/types.d.ts
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
/** 请求客户端配置 */
interface ClientConfig {
  /**
   * 源
   * - 由协议、主机名（域名）和端口定义。
   * - 如果未指定，默认为当前页面的`location.href`。
   * - 如果 `url` 已经是一个完整的[URL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL) ，则会忽略此配置。
   */
  origin?: string
  /**
   * 请求超时时间 (单位：ms)
   * - 默认为0，即不超时
   * - 设置超时时间后，请求会在指定时间后自动终止，并抛出408错误。
   * - 除了上传下载文件，通常情况下，你的普通请求不应该很长。
   */
  timeout?: number
  /**
   * HTTP默认请求头
   * - 这里指定的是实例请求头配置。
   * - 如果在请求配置中传入了`headers`，则header会被合并，相同的header会被请求配置覆盖。
   */
  headers?: Record<string, string>
  /**
   * 控制`浏览器`是否发送凭证（Cookie / HTTP 认证 / TLS 客户端证书）
   * - 默认发送，即跨域请求也会携带凭证。
   * - 如果设置为`false`，则在任何请求时都不会发送凭证。
   * @default true
   */
  credentials?: boolean
  /**
   * 插件
   * - 插件是一种扩展机制，可以用于修改请求和响应。
   */
  plugins?: HTTPClientPlugin[]
  /**
   * 自定义请求引擎
   * - 未传入时，自动选择 FetchEngine（全局 fetch 可用）或 XHREngine
   * - 可传入自定义 HttpEngine 子类实例以对接其他底层（如 undici、msw mock）
   */
  engine?: HttpEngine
  /**
   * 响应类型
   * - 'json': 解析为 JSON
   * - 'text': 解析为文本
   * - 'blob': 解析为 Blob
   * - 'arraybuffer': 解析为 ArrayBuffer
   * - 未设置时根据响应 `Content-Type` 自动推断
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  /** 默认终止信号（可被单次请求的 `signal` 覆盖） */
  signal?: AbortSignal
  /** 默认上传进度回调 */
  onUploadProgress?: (info: ProgressInfo) => void
  /** 默认下载进度回调 */
  onDownloadProgress?: (info: ProgressInfo) => void
  /**
   * XSRF Cookie 名称
   * - 默认 `'XSRF-TOKEN'`
   * - 仅在浏览器环境且请求为同域时生效
   */
  xsrfCookieName?: string
  /**
   * XSRF Header 名称
   * - 默认 `'X-XSRF-TOKEN'`
   */
  xsrfHeaderName?: string
}
interface RequestConfig {
  /**
   * 请求方法
   * - 默认`GET`
   */
  method?: RequestMethod
  /**
   * 请求体
   * - ReadableStream数据在不支持fetch的环境下无效
   * - JS对象会被自动转换为JSON字符串，并且会自动设置`Content-Type`为`application/json`
   * - `URLSearchParams` 会自动设置 `Content-Type: application/x-www-form-urlencoded`
   * - `FormData` 会直接作为 body，不自动设置 `Content-Type`（由浏览器设置 multipart boundary）
   */
  body?: BodyInit | Record<string, any> | URLSearchParams | FormData
  /**
   * 查询参数
   * - 如果你在url中也指定了查询参数，那么它们会被合并。
   * - 查询参数会被自动转换为`key=value`的形式
   */
  query?: Record<string, any>
  /**
   * 请求头
   * @link [查看](https://developer.mozilla.org/zh-CN/docs/Glossary/Request_header)
   */
  headers?: Record<string, string>
  /** 请求超时时间 */
  timeout?: number
  /** 请求是否携带凭证 */
  credentials?: boolean
  /**
   * 响应类型
   * - 'json': 解析为 JSON
   * - 'text': 解析为文本
   * - 'blob': 解析为 Blob
   * - 'arraybuffer': 解析为 ArrayBuffer
   * - 未设置时根据响应 `Content-Type` 自动推断
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  /** 用户传入的终止信号（per-request） */
  signal?: AbortSignal
  /** 上传进度（Fetch 引擎下会被静默忽略） */
  onUploadProgress?: (info: ProgressInfo) => void
  /** 下载进度（需引擎支持流式读取） */
  onDownloadProgress?: (info: ProgressInfo) => void
  /**
   * XSRF Cookie 名称（覆盖 ClientConfig）
   * - 默认 `'XSRF-TOKEN'`
   */
  xsrfCookieName?: string
  /**
   * XSRF Header 名称（覆盖 ClientConfig）
   * - 默认 `'X-XSRF-TOKEN'`
   */
  xsrfHeaderName?: string
  /** @internal 内置重试逻辑写入的重试次数，业务代码勿依赖 */
  _retryAttempt?: number
}
/** 传输进度信息 */
interface ProgressInfo {
  /** 已传输字节数 */
  loaded: number
  /** 总字节数，未知时为 0 */
  total: number
  /** 进度百分比 0-100，total 为 0 时固定返回 0 */
  percent: number
}
type AliasRequestConfig = Omit<RequestConfig, 'method'>
interface HTTPResponse<T = any> {
  /** 响应体 */
  body: T
  /** HTTP状态码 */
  code: number
  /** 响应标头（set-cookie 多值以换行符分隔） */
  headers: Record<string, string>
  /** 原始响应对象 */
  raw?: Response | any
}
type HttpErrorCode =
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK'
  | 'PARSE'
  | 'AUTH'
  | 'UNKNOWN'
  | 'RETRY_LIMIT_EXCEEDED'
  | 'PLUGIN'
interface HTTPErrorOptions<T = any> {
  code: HttpErrorCode
  url?: string
  config?: RequestConfig
  response?: HTTPResponse<T>
  cause?: unknown
}
declare class HTTPError<T = any> extends Error {
  code: HttpErrorCode
  url?: string
  config?: RequestConfig
  response?: HTTPResponse<T>
  cause?: unknown
  constructor(message: string, options: HTTPErrorOptions<T>)
}
interface IHTTPClient {
  getEngine(): HttpEngine
  registerPlugin(plugin: HTTPClientPlugin): void
  request<T = any>(url: string, config?: RequestConfig): Promise<HTTPResponse<T>>
  get<T = any>(url: string, config?: AliasRequestConfig): Promise<HTTPResponse<T>>
  post<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  put<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  delete<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  patch<T = any>(
    url: string,
    body?: RequestConfig['body'],
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<HTTPResponse<T>>
  head<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  options<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<HTTPResponse<T>>
  abort(): void
  group(prefix: string): IHTTPClient
}
interface RequestContext {
  url: string
  config: RequestConfig
}
/**
 * 插件钩子返回类型
 */
interface PluginHookResult {
  /** 修改后的 URL */
  url?: string
  /** 修改后的请求配置 */
  config?: RequestConfig
}
interface BeforeRequestContext {
  /** 最终请求 URL */
  url: string
  /** 最终请求配置 */
  config: RequestConfig
}
interface AfterRespondContext {
  /** 响应对象 */
  response: HTTPResponse
  /** 最终请求 URL */
  url: string
  /** 最终请求配置 */
  config: RequestConfig
  /** 调用 client.request / get 等方法时传入的原始 URL */
  originalUrl: string
  /** 合并客户端默认值后、beforeRequest 前的原始配置 */
  originalConfig: RequestConfig
  /** 请求客户端 */
  client: IHTTPClient
}
/** 请求客户端插件 */
interface HTTPClientPlugin {
  /** 插件名称 */
  name: string
  /**
   * 请求前钩子
   * @param url 请求 URL
   * @param config 请求配置
   * @returns 修改后的 URL 和请求选项
   */
  beforeRequest?(
    context: BeforeRequestContext
  ): Promise<PluginHookResult | void> | PluginHookResult | void
  /**
   * 响应后钩子
   * @param context 响应后上下文
   */
  afterRespond?(context: AfterRespondContext): Promise<HTTPResponse | void> | HTTPResponse | void
  /**
   * 错误钩子
   * - 请求链中出现错误时触发
   * - 返回 HTTPResponse 时视为错误已恢复，以首个非空返回为准；后续插件仍会执行
   */
  onError?(
    error: unknown,
    context: RequestContext
  ): Promise<HTTPResponse | void> | HTTPResponse | void
}
type ClientPlugin = HTTPClientPlugin
//#endregion
export {
  AliasRequestConfig,
  ClientConfig,
  ClientPlugin,
  HTTPClientPlugin,
  HTTPError,
  HTTPErrorOptions,
  HTTPResponse,
  HttpErrorCode,
  IHTTPClient,
  PluginHookResult,
  ProgressInfo,
  RequestConfig,
  RequestContext,
  RequestMethod
}
