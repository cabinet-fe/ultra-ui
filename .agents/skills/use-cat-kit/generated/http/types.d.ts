//#region src/types.d.ts
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
/** 请求客户端配置 */
interface ClientConfig {
  /**
   * 源
   * - 由协议、主机名（域名）和端口定义。
   * - 如果未指定，默认为当前页面的`location.href`。
   * - 如果 `url` 已经是一个完整的[URL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL) ，则会忽略此配置。
   */
  origin?: string;
  /**
   * 请求超时时间 (单位：ms)
   * - 默认为0，即不超时
   * - 设置超时时间后，请求会在指定时间后自动终止，并抛出408错误。
   * - 除了上传下载文件，通常情况下，你的普通请求不应该很长。
   */
  timeout?: number;
  /**
   * HTTP默认请求头
   * - 这里指定的是实例请求头配置。
   * - 如果在请求配置中传入了`headers`，则header会被合并，相同的header会被请求配置覆盖。
   */
  headers?: Record<string, string>;
  /**
   * 控制`浏览器`是否发送凭证
   * - 默认发送，即在同源请求时发送凭证。
   * - 如果设置为`false`，则在任何请求时都不会发送凭证。
   * @default true
   */
  credentials?: boolean;
  /**
   * 插件
   * - 插件是一种扩展机制，可以用于修改请求和响应。
   */
  plugins?: ClientPlugin[];
}
interface RequestConfig {
  /**
   * 请求方法
   * - 默认`GET`
   */
  method?: RequestMethod;
  /**
   * 请求体
   * - ReadableStream数据在不支持fetch的环境下无效
   * - JS对象会被自动转换为JSON字符串，并且会自动设置`Content-Type`为`application/json`
   */
  body?: BodyInit | Record<string, any>;
  /**
   * 查询参数
   * - 如果你在url中也指定了查询参数，那么它们会被合并。
   * - 查询参数会被自动转换为`key=value`的形式
   */
  query?: Record<string, any>;
  /**
   * 请求头
   * @link [查看](https://developer.mozilla.org/zh-CN/docs/Glossary/Request_header)
   */
  headers?: Record<string, string>;
  /** 请求超时时间 */
  timeout?: number;
  /** 请求是否携带凭证 */
  credentials?: boolean;
  /**
   * 响应类型
   * - 'json': 解析为 JSON (默认)
   * - 'text': 解析为文本
   * - 'blob': 解析为 Blob
   * - 'arraybuffer': 解析为 ArrayBuffer
   * @default 'json'
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  /** 用户传入的终止信号（per-request） */
  signal?: AbortSignal;
  /** 上传进度（Fetch 引擎下会被静默忽略） */
  onUploadProgress?: (info: ProgressInfo) => void;
  /** 下载进度（需引擎支持流式读取） */
  onDownloadProgress?: (info: ProgressInfo) => void;
  /**
   * @internal 内置重试逻辑写入的重试次数，业务代码勿依赖
   */
  _retryAttempt?: number;
}
/** 传输进度信息 */
interface ProgressInfo {
  /** 已传输字节数 */
  loaded: number;
  /** 总字节数，未知时为 0 */
  total: number;
  /** 进度百分比 0-100，total 为 0 时固定返回 0 */
  percent: number;
}
type AliasRequestConfig = Omit<RequestConfig, 'method'>;
interface HTTPResponse<T = any> {
  /** 响应的数据 */
  data: T;
  /** HTTP状态码 */
  code: number;
  /** 响应标头 */
  headers: Record<string, string>;
  /** 原始响应对象 */
  raw?: Response | any;
}
type HttpErrorCode = 'TIMEOUT' | 'ABORTED' | 'NETWORK' | 'PARSE' | 'UNKNOWN' | 'RETRY_LIMIT_EXCEEDED';
interface HTTPErrorOptions<T = any> {
  code: HttpErrorCode;
  url?: string;
  config?: RequestConfig;
  response?: HTTPResponse<T>;
  cause?: unknown;
}
declare class HTTPError<T = any> extends Error {
  code: HttpErrorCode;
  url?: string;
  config?: RequestConfig;
  response?: HTTPResponse<T>;
  cause?: unknown;
  constructor(message: string, options: HTTPErrorOptions<T>);
}
interface RequestContext {
  url: string;
  config: RequestConfig;
  /**
   * 与 {@link PluginContext.retry} 相同，供 `onError` 中恢复请求时使用。
   */
  retry?: (patch?: Partial<RequestConfig>) => Promise<HTTPResponse>;
}
/** 插件在 afterRespond 中可用的上下文 */
interface PluginContext {
  /** 重试当前请求，可传入部分配置覆盖（与原始请求配置合并） */
  retry: (config?: Partial<RequestConfig>) => Promise<HTTPResponse>;
}
/**
 * 插件钩子返回类型
 */
interface PluginHookResult {
  /** 修改后的 URL */
  url?: string;
  /** 修改后的请求配置 */
  config?: RequestConfig;
}
/** 请求客户端插件 */
interface ClientPlugin {
  /**
   * 请求前钩子
   * @param url 请求 URL
   * @param config 请求配置
   * @returns 修改后的 URL 和请求选项
   */
  beforeRequest?(url: string, config: RequestConfig): Promise<PluginHookResult | void> | PluginHookResult | void;
  /**
   * 响应后钩子
   * @param response 响应对象
   * @param url 请求 URL
   * @param config 请求配置
   * @returns 修改后的响应对象
   */
  afterRespond?(response: HTTPResponse, url: string, config: RequestConfig, context?: PluginContext): Promise<HTTPResponse | void> | HTTPResponse | void;
  /**
   * 错误钩子
   * - 请求链中出现错误时触发
   * - 返回 HTTPResponse 时视为错误已恢复，以首个非空返回为准；后续插件仍会执行
   */
  onError?(error: unknown, context: RequestContext): Promise<HTTPResponse | void> | HTTPResponse | void;
}
//#endregion
export { AliasRequestConfig, ClientConfig, ClientPlugin, HTTPError, HTTPErrorOptions, HTTPResponse, HttpErrorCode, PluginContext, PluginHookResult, ProgressInfo, RequestConfig, RequestContext, RequestMethod };
//# sourceMappingURL=types.d.ts.map