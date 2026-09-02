# HTTP 插件 — API

```ts
interface HTTPClientPlugin {
  name: string
  beforeRequest?(ctx: {
    url: string
    config: RequestConfig
  }): PluginHookResult | void | Promise<PluginHookResult | void>
  afterRespond?(ctx: {
    response: HTTPResponse
    url: string
    config: RequestConfig
    originalUrl: string
    originalConfig: RequestConfig
    client: IHTTPClient
  }): HTTPResponse | void | Promise<HTTPResponse | void>
  onError?(
    error: HTTPError,
    ctx: { url: string; config: RequestConfig }
  ): HTTPResponse | void | Promise<HTTPResponse | void>
}

declare function TokenPlugin(options: TokenPluginOptions): HTTPClientPlugin
declare function MethodOverridePlugin(
  options?: MethodOverridePluginOptions
): HTTPClientPlugin
```

`TokenPluginOptions` 含 `getter`、`header?`、`shouldRefresh?`、`onRefresh?`、`maxRetries?` 等，见 generated。  
`MethodOverridePluginOptions`：`methods?`、`header?`。
