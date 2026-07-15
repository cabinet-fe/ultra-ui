# HTTP 客户端 — API

```ts
declare function mergeRequestConfig(
  base: RequestConfig,
  patch: RequestConfig
): RequestConfig

declare class HTTPClient implements IHTTPClient {
  constructor(prefix?: string, config?: ClientConfig)
  getEngine(): HttpEngine
  registerPlugin(plugin: HTTPClientPlugin): void
  group(prefix: string): HTTPClient
  abort(): void
  request<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<HTTPResponse<T>>
  get<T = any>(
    url: string,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  post<T = any>(
    url: string,
    body?: any,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  put<T = any>(
    url: string,
    body?: any,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  delete<T = any>(
    url: string,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  patch<T = any>(
    url: string,
    body?: any,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  head<T = any>(
    url: string,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
  options<T = any>(
    url: string,
    config?: AliasRequestConfig
  ): Promise<HTTPResponse<T>>
}

declare class HTTPError extends Error {
  code: HttpErrorCode
  response?: HTTPResponse
}
```

引擎：`HttpEngine`（抽象）、`FetchEngine`、`XHREngine`。  
`HTTPResponse` 的 `headers` 类型为 `Record<string, string>`。
