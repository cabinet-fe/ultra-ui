# http — 插件系统

插件按数组顺序执行：`beforeRequest` → 请求 → `afterRespond`；出错时还可触发 `onError`。

## 插件接口

```typescript
interface ClientPlugin {
  beforeRequest?(url, config): Promise<{ url?, config? } | void> | { url?, config? } | void
  afterRespond?(
    response,
    url,
    config,
    context?
  ): Promise<HTTPResponse | void> | HTTPResponse | void
  /** 返回 HTTPResponse 时表示错误已由插件恢复（以首个非空为准） */
  onError?(error, { url, config, retry? }): Promise<HTTPResponse | void> | HTTPResponse | void
}
```

`afterRespond` / `onError` 中的 `retry` 与 `PluginContext.retry` 一致，用于在插件内发起合并配置后的重试。

## 内置插件

### TokenPlugin

```typescript
import { TokenPlugin } from '@cat-kit/http'
// 或: import { TokenPlugin } from '@cat-kit/http/plugins'

TokenPlugin({
  getter: () => localStorage.getItem('token'),
  headerName?: string, // 默认 'Authorization'
  authType?: 'Bearer' | 'Basic' | 'Custom',
  formatter?: (token) => string, // authType='Custom' 时
  onRefresh?: () => Promise<void>,
  isExpired?: () => boolean,
  isRefreshExpired?: () => boolean,
  /** 与响应级重试配合时须同时配置 onRefresh */
  shouldRefresh?: (response: HTTPResponse) => boolean,
  onRefreshExpired?: () => void
})
```

### RetryPlugin

```typescript
import { RetryPlugin } from '@cat-kit/http'
// 或: import { RetryPlugin } from '@cat-kit/http/plugins'

RetryPlugin({
  maxRetries?: number, // 默认 3
  delay?: number | ((attempt: number) => number), // 默认指数退避，上限 30s
  retryOn?: (error, context) => boolean,
  retryOnStatus?: number[] // 默认含 408、429、5xx 等
})
```

### MethodOverridePlugin

```typescript
import { MethodOverridePlugin } from '@cat-kit/http'

MethodOverridePlugin({
  methods?: RequestMethod[], // 默认 ['DELETE','PUT','PATCH']
  overrideMethod?: RequestMethod, // 默认 'POST'
  headerName?: string // 默认 'X-HTTP-Method-Override'
})
```

## 自定义插件

```typescript
function MyPlugin(): ClientPlugin {
  return {
    beforeRequest(url, config) {
      // 返回新对象修改请求，避免直接修改 config
      return { config: { ...config, query: { ...config.query, _t: Date.now() } } }
    },
    afterRespond(response) {
      return response
    }
  }
}
```
