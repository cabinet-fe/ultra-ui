# http — plugins

`@cat-kit/http` 内置三个插件：Token 认证、请求重试、方法重写。插件实现 `HTTPClientPlugin` 接口。

## 插件接口

```ts
interface HTTPClientPlugin {
  name: string  // 必须唯一

  beforeRequest?(url: string, config: RequestConfig):
    Promise<PluginHookResult | void> | PluginHookResult | void

  afterRespond?(response: HTTPResponse, url: string, config: RequestConfig,
    context?: PluginContext): Promise<HTTPResponse | void> | HTTPResponse | void

  onError?(error: unknown, context: RequestContext):
    Promise<HTTPResponse | void> | HTTPResponse | void
}
```

**钩子执行流程**：

```
beforeRequest（所有插件依次执行）
  → 引擎发起请求
  → afterRespond（所有插件依次执行，含非 2xx 响应）
  → onError（错误恢复链）
```

**针对非 2xx 响应（如 401）的特殊处理**：引擎抛出的 `HTTPError` 中若包含 `response` 字段，插件的 `afterRespond` 仍会依次执行。若任一插件通过 `afterRespond` 恢复了响应且最终状态码为 200-299，请求视为成功。

**动态注册**：

```ts
http.registerPlugin(plugin: HTTPClientPlugin): void
```

在客户端构造后动态注册插件，会校验插件名唯一性。

---

## TokenPlugin

```ts
import { TokenPlugin } from '@cat-kit/http'
```

自动管理认证令牌的插件。支持 Bearer/Basic/Custom 模式，内置令牌刷新和过期检测。

### 配置

```ts
new TokenPlugin({
  getter: () => string | null | undefined,               // 必填：获取 token
  headerName?: 'Authorization',                          // 请求头名
  authType?: 'Bearer' | 'Basic' | 'Custom',              // 认证类型，默认 'Bearer'
  formatter?: (token: string) => string,                 // authType='Custom' 时使用
  onRefresh?: () => Promise<void>,                       // 刷新令牌回调
  isExpired?: () => boolean,                             // 令牌过期判断
  isRefreshExpired?: () => boolean,                      // 刷新令牌过期判断
  shouldRefresh?: (response: HTTPResponse) => boolean,   // 响应触发刷新判断
  onRefreshExpired?: () => void                          // 刷新令牌过期回调（如登出）
})
```

### 行为

**`beforeRequest`**：
1. 若 `isRefreshExpired?.()` → 调 `onRefreshExpired?.()`，抛 `HTTPError({ code: 'AUTH' })`
2. 若有正在进行的刷新 → 排队等待
3. 若 `isExpired?.()` → 执行 `onRefresh()`
4. 调用 `getter()` 获取 token，按 `authType` 格式写入 headers

**`afterRespond`**：
- 若 `shouldRefresh?.(response)` 且配置了 `onRefresh` → 刷新后通过 `context.retry()` 重试

### 示例

```ts
import { HTTPClient, TokenPlugin } from '@cat-kit/http'

let accessToken = ''
let refreshToken = ''

const http = new HTTPClient('/api', {
  origin: 'https://api.example.com',
  plugins: [
    new TokenPlugin({
      getter: () => accessToken,
      onRefresh: async () => {
        const res = await fetch('/auth/refresh', {
          body: JSON.stringify({ refreshToken })
        })
        const data = await res.json()
        accessToken = data.accessToken
      },
      isExpired: () => !accessToken,
      shouldRefresh: (res) => res.code === 401
    })
  ]
})
```

---

## RetryPlugin

```ts
import { RetryPlugin } from '@cat-kit/http'
```

自动重试失败的请求，支持自定义重试条件和退避策略。

### 配置

```ts
new RetryPlugin({
  maxRetries?: 3,                                        // 最大重试次数
  delay?: 1000 | ((attempt: number) => number),           // 延迟（ms），默认指数退避
  retryOn?: (error: unknown, context: RequestContext) => boolean, // 自定义重试判断
  retryOnStatus?: [408, 429, 500, 502, 503, 504]        // 按状态码重试
})
```

**默认退避**：`Math.min(1000 * 2 ** attempt, 30000)`
- 第 1 次重试：1s
- 第 2 次重试：2s
- 第 3 次重试：4s
- 封顶：30s

**默认重试条件**（未设 `retryOn` 时）：
- 非 2xx 响应且状态码在 `retryOnStatus` 中
- 网络错误（`code === 'NETWORK'`）
- 超时（`code === 'TIMEOUT'`）

### 示例

```ts
const http = new HTTPClient('/api', {
  origin: 'https://api.example.com',
  plugins: [
    new RetryPlugin({
      maxRetries: 5,
      retryOnStatus: [429, 503],
      delay: (attempt) => attempt * 2000 // 2s, 4s, 6s...
    })
  ]
})
```

---

## MethodOverridePlugin

```ts
import { MethodOverridePlugin } from '@cat-kit/http'
```

绕过某些环境（防火墙/代理）对 DELETE/PUT/PATCH 的限制，将请求方法改写为 POST，原始方法写入 `X-HTTP-Method-Override` 头。

### 配置

```ts
new MethodOverridePlugin({
  methods?: ['DELETE', 'PUT', 'PATCH'],  // 要改写的方法
  overrideMethod?: 'POST',                // 改写为的方法
  headerName?: 'X-HTTP-Method-Override'   // 自定义头名
})
```

### 示例

```ts
const http = new HTTPClient('/api', {
  origin: 'https://api.example.com',
  plugins: [
    new MethodOverridePlugin({
      methods: ['DELETE'],
      overrideMethod: 'POST'
    })
  ]
})

// DELETE /api/users/1 → POST /api/users/1
//   附带 X-HTTP-Method-Override: DELETE
await http.delete('/users/1')
```

---

## 自定义插件

实现 `HTTPClientPlugin` 接口即可：

```ts
import { HTTPClientPlugin } from '@cat-kit/http'

const timingPlugin: HTTPClientPlugin = {
  name: 'timing',

  async beforeRequest(url, config) {
    ;(config as any)._startTime = Date.now()
  },

  async afterRespond(response) {
    const reqTime = (response as any)._startTime
    console.debug(`[${response.code}] ${reqTime}ms`)
  },

  async onError(error, { url, config }) {
    console.error(`[${config.method}] ${url} failed:`, error)
  }
}
```

> 类型签名：`../../generated/http/plugins/`
