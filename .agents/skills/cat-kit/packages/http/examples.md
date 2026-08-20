# @cat-kit/http — 组合示例

```ts
import { HTTPClient, HTTPError, TokenPlugin } from '@cat-kit/http'

const api = new HTTPClient('/v1', {
  origin: 'https://api.example.com',
  timeout: 15_000,
  plugins: [
    TokenPlugin({
      getter: async () => sessionStorage.getItem('access_token')
    })
  ]
})

const admin = api.group('/admin')

try {
  const { body } = await admin.post<{ ok: boolean }>('/jobs', {
    name: 'export'
  })
  console.log(body.ok)
} catch (e) {
  if (e instanceof HTTPError) throw e
}
```
