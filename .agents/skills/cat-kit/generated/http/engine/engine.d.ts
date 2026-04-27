import { HTTPResponse, RequestConfig } from '../types.js'

//#region src/engine/engine.d.ts
declare abstract class HttpEngine {
  /**
   * 发送 HTTP 请求
   * @param url 请求 URL
   * @param config 请求配置
   */
  abstract request<T = any>(url: string, config: RequestConfig): Promise<HTTPResponse<T>>
  /**
   * 中止 HTTP 请求
   */
  abstract abort(): void
}
//#endregion
export { HttpEngine }
