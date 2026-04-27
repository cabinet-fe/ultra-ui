# http — client

`HTTPClient` 是 `@cat-kit/http` 的核心，基于插件架构的 HTTP 客户端。

## 构造与配置

```ts
class HTTPClient {
  constructor(prefix?: string, config?: ClientConfig)
}
```

- **`prefix`**：URL 前缀，所有请求的 base path（如 `'/api'`）
- **`config`**：客户端级别的全局配置

### `ClientConfig` 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `origin` | `string` | — | 请求基础 URL（协议+主机+端口）。若请求 URL 已是完整 URL 则忽略 |
| `timeout` | `number` | `0` | 超时（ms），0 表示不超时。超时触发 `HTTPError({ code: 'TIMEOUT' })` |
| `headers` | `Record<string, string>` | — | 默认请求头，与单次请求 header 合并（单次优先） |
| `credentials` | `boolean` | `true` | 是否发送 Cookie/认证信息（`true` → `include`，`false` → `omit`） |
| `responseType` | `'json' \| 'text' \| 'blob' \| 'arraybuffer'` | — | 响应解析类型，未设时按 `Content-Type` 推断 |
| `signal` | `AbortSignal` | — | 默认中止信号 |
| `onUploadProgress` | `(info: ProgressInfo) => void` | — | 默认上传进度回调 |
| `onDownloadProgress` | `(info: ProgressInfo) => void` | — | 默认下载进度回调 |
| `xsrfCookieName` | `string` | `'XSRF-TOKEN'` | XSRF Cookie 名，仅浏览器同域生效 |
| `xsrfHeaderName` | `string` | `'X-XSRF-TOKEN'` | XSRF Header 名 |
| `plugins` | `HTTPClientPlugin[]` | — | 插件列表 |
| `engine` | `HttpEngine` | — | 自定义引擎。未传时自动选择（`fetch` 可用时选 `FetchEngine`，否则 `XHREngine`） |

```ts
const http = new HTTPClient('/api', {
  origin: 'https://api.example.com',
  timeout: 30_000,
  headers: { 'X-Client-Version': '1.0.0' }
})
```

## 请求方法

### `request` — 通用请求

```ts
.request<T = any>(url: string, config: RequestConfig): Promise<HTTPResponse<T>>
```

核心方法，所有别名方法最终调用此方法。

### 别名方法

| 方法 | 签名 |
|------|------|
| `.get<T>(url, config: AliasRequestConfig)` | GET 请求，不允许传 `method` |
| `.post<T>(url, body?, config?)` | POST 请求 |
| `.put<T>(url, body?, config?)` | PUT 请求 |
| `.patch<T>(url, body?, config?)` | PATCH 请求 |
| `.delete<T>(url, config?)` | DELETE 请求 |
| `.head<T>(url, config?)` | HEAD 请求 |
| `.options<T>(url, config?)` | OPTIONS 请求 |

`body` 参数自动处理：
- 对象/数组 → `JSON.stringify`，自动设 `Content-Type: application/json`
- `URLSearchParams` → 自动设 `Content-Type: application/x-www-form-urlencoded`
- `FormData` → 不做处理
- GET/HEAD 请求自动忽略 body

### `RequestConfig` 选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `method` | `RequestMethod` | 请求方法，默认 `'GET'` |
| `body` | `BodyInit \| Record<string, any> \| URLSearchParams \| FormData` | 请求体 |
| `query` | `Record<string, any>` | 查询参数 |
| `headers` | `Record<string, string>` | 单次请求头 |
| `timeout` | `number` | 单次超时 |
| `credentials` | `boolean` | 单次凭证配置 |
| `responseType` | `'json' \| 'text' \| 'blob' \| 'arraybuffer'` | 单次响应类型 |
| `signal` | `AbortSignal` | 单次中止信号 |
| `onUploadProgress` / `onDownloadProgress` | `(info: ProgressInfo) => void` | 进度回调 |
| `xsrfCookieName` / `xsrfHeaderName` | `string` | 单次 XSRF 配置 |

```ts
// GET 请求带查询参数
const res = await http.get('/users', {
  query: { page: 1, limit: 10 }
})

// POST 请求
await http.post('/users', { name: 'Alice', email: 'alice@example.com' })

// 带自定义 headers
await http.get('/data', {
  headers: { 'X-Custom': 'value' },
  timeout: 5_000
})
```

## 响应处理

### `HTTPResponse<T>`

```ts
interface HTTPResponse<T = any> {
  data: T                                // 响应体数据
  code: number                           // HTTP 状态码
  headers: Record<string, string | string[]> // 响应头（set-cookie 保留数组）
  raw?: Response | any                   // 原始响应对象
}
```

## 错误处理

### `HTTPError<T>`

```ts
class HTTPError<T = any> extends Error {
  code: HttpErrorCode       // 错误码
  url?: string              // 请求 URL
  config?: RequestConfig    // 请求配置
  response?: HTTPResponse<T> // 响应（非 2xx 响应时附在此处）
  cause?: unknown           // 原始错误
}
```

**错误码（`HttpErrorCode`）**：
- `'TIMEOUT'` — 请求超时
- `'ABORTED'` — 请求被中止
- `'NETWORK'` — 网络错误或非 2xx 响应
- `'PARSE'` — 响应解析失败
- `'AUTH'` — 认证失败
- `'RETRY_LIMIT_EXCEEDED'` — 重试次数耗尽
- `'PLUGIN'` — 插件相关错误

```ts
try {
  await http.get('/data')
} catch (err) {
  if (err instanceof HTTPError) {
    console.error(err.code, err.url, err.response?.code)
  }
}
```

## 中断

```ts
.abort(): void
```

中止所有在途请求。

```ts
// 单次请求中断
const ctrl = new AbortController()
http.get('/slow', { signal: ctrl.signal })
ctrl.abort()

// 全局中断
http.abort()
```

## 子客户端

```ts
.group(prefix: string): HTTPClient
```

基于父客户端创建子客户端，继承全部配置，自动拼接 URL 前缀。

插件语义：父影响子（父后续注册的插件子可见），子不影响父，同名校验跨父子层级。

```ts
const api = new HTTPClient('/api', { origin: 'https://example.com' })
const usersApi = api.group('/users')   // prefix: /api/users
const postsApi = api.group('/posts')   // prefix: /api/posts
```

> 类型签名：`../../generated/http/client.d.ts`
