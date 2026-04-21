import { HTTPResponse, RequestConfig } from '../types.js'
import { HttpEngine } from './engine.js'

//#region src/engine/fetch.d.ts
declare class FetchEngine extends HttpEngine {
  private controllers
  request<T = any>(url: string, config: RequestConfig): Promise<HTTPResponse<T>>
  private parseResponseWithDownloadProgress
  private decodeResponseBody
  private parseResponseData
  abort(): void
}
//#endregion
export { FetchEngine }
