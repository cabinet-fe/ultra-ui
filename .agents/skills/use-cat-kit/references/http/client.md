# http — HTTPClient

```typescript
import { HTTPClient } from '@cat-kit/http'

const http = new HTTPClient('/api', {
  origin?: string,
  timeout?: number,        // ms，0=不超时
  headers?: Record<string, string>,
  credentials?: boolean,   // 默认 true
  plugins?: ClientPlugin[]
})
```

## 请求方法

```typescript
http.get<T>(url, config?)
http.post<T>(url, body?, config?)
http.put<T>(url, body?, config?)
http.delete<T>(url, config?)
http.patch<T>(url, body?, config?)
http.head<T>(url, config?)
http.options<T>(url, config?)

// 通用请求
http.request<T>(url, {
  method?, body?, query?, headers?,
  timeout?, credentials?,
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
})
```

返回 `HTTPResponse<T> { data, code, headers }`。body 为对象时自动 JSON 序列化，query 自动拼接到 URL。

## abort / group

```typescript
http.abort()                    // 中止所有请求

const userApi = http.group('/users')
await userApi.get('/')          // → /api/users/
userApi.abort()                 // 只中止该分组
```

## 类型

```typescript
interface HTTPResponse<T = any> { data: T; code: number; headers: Record<string, string> }

type HttpErrorCode = 'TIMEOUT' | 'ABORTED' | 'NETWORK' | 'PARSE' | 'UNKNOWN'

class HTTPError<T = any> extends Error {
  code: HttpErrorCode; url?; config?; response?; cause?
}
```
