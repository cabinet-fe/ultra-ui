# HTTP 客户端 — 示例

```ts
import { HTTPClient, HTTPError, FetchEngine } from '@cat-kit/http'

const api = new HTTPClient('/api', {
  origin: 'https://example.com',
  timeout: 10_000,
  engine: new FetchEngine()
})

const users = api.group('/users')

try {
  const { body } = await users.get<{ id: number; name: string }>('/42')
  console.log(body.name)
} catch (error) {
  if (error instanceof HTTPError) {
    console.error(error.code, error.response?.code)
  }
}

api.abort()
```
