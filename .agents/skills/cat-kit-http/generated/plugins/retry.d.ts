import { HTTPClientPlugin, RequestContext } from '../types.js'

//#region src/plugins/retry.d.ts
interface RetryPluginOptions {
  maxRetries?: number
  delay?: number | ((attempt: number) => number)
  retryOn?: (error: unknown, context: RequestContext) => boolean
  retryOnStatus?: number[]
}
/**
 * 在请求失败时按策略自动重试（通过 `onError` + `context.retry`）。
 */
declare function RetryPlugin(options?: RetryPluginOptions): HTTPClientPlugin
//#endregion
export { RetryPlugin, RetryPluginOptions }
