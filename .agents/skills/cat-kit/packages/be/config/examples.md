# 配置 — 示例

```ts
import { loadConfig, loadEnv, mergeConfig, parseEnv } from '@cat-kit/be'

const raw = await loadEnv({ mode: 'production' })
const env = parseEnv(
  { PORT: { type: 'number', default: 3000 } },
  raw
)

const fileCfg = await loadConfig('./config.json')
const cfg = mergeConfig({ port: 3000 }, fileCfg, { port: env.PORT })
```
