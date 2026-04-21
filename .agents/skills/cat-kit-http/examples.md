# @cat-kit/http 示例

```ts
import { HTTPClient } from '@cat-kit/http'

const http = new HTTPClient('/api', { origin: 'https://api.example.com', timeout: 30_000 })

const res = await http.get('/v1/status')
```

详见 [`generated/client.d.ts`](generated/client.d.ts) 与 [`generated/index.d.ts`](generated/index.d.ts)。
