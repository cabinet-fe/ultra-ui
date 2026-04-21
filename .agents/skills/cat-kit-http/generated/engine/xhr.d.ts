import { HTTPResponse, RequestConfig } from '../types.js'
import { HttpEngine } from './engine.js'

//#region src/engine/xhr.d.ts
declare class XHREngine extends HttpEngine {
  /** 请求中的实例 */
  private xhrSets
  request<T = any>(url: string, config: RequestConfig): Promise<HTTPResponse<T>>
  /**
   * 解析响应头
   * @param headerStr 响应头字符串
   * @returns 解析后的响应头对象
   */
  private parseHeaders
  sendHeaders(xhr: XMLHttpRequest, headers: Record<string, string>): void
  abort(): void
}
//#endregion
export { XHREngine }
