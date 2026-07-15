import { HTTPResponse, RequestConfig } from '../types.js'
import { HttpEngine } from './engine.js'

//#region src/engine/fetch.d.ts
declare class FetchEngine extends HttpEngine {
  private controllers
  request<T = any>(url: string, config?: RequestConfig): Promise<HTTPResponse<T>>
  /**
   * 以流式方式读取响应体并透传下载进度回调
   * - 分片累积后合并为完整 Uint8Array 再解码
   */
  private parseResponseWithDownloadProgress
  /**
   * 将文本解析为 JSON
   * - 空文本返回 null
   * - 解析失败抛 PARSE 错误（含响应上下文）
   */
  private parseJSONBody
  /**
   * 将原始字节数组按指定响应类型解码
   * - arraybuffer: 返回 .buffer slice
   * - blob: 构建 Blob 对象
   * - text/json: 先 TextDecoder 解码，json 再调用 parseJSONBody
   */
  private decodeBytes
  /**
   * 从 Response 中按指定类型直接解析数据（非流式路径）
   * - text: response.text()
   * - blob: response.blob()
   * - arraybuffer: response.arrayBuffer()
   * - json（默认）: 先 text() 再 JSON.parse
   */
  private parseResponseData
  abort(): void
}
//#endregion
export { FetchEngine }
