# HTTP 插件 — 示例

```ts
import {
  HTTPClient,
  MethodOverridePlugin,
  TokenPlugin
} from '@cat-kit/http'

const http = new HTTPClient('/api', {
  origin: 'https://example.com',
  plugins: [
    TokenPlugin({
      getter: () => localStorage.getItem('token'),
      shouldRefresh: (error) => error.response?.code === 401,
      onRefresh: async () => {
        // 刷新并写回 token
      }
    }),
    MethodOverridePlugin({ methods: ['DELETE'] })
  ]
})

http.registerPlugin({
  name: 'log',
  beforeRequest({ url }) {
    console.debug('→', url)
  }
})
```
