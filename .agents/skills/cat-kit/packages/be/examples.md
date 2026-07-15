# @cat-kit/be — 组合示例

```ts
import {
  Logger,
  LogLevel,
  loadEnv,
  memoize,
  parseEnv,
  readDir,
  writeJson
} from '@cat-kit/be'

const raw = await loadEnv({ mode: 'production' })
const env = parseEnv({ PORT: { type: 'number', default: 3000 } }, raw)

const logger = new Logger({ level: LogLevel.INFO })
const listFiles = memoize(async (dir: string) =>
  readDir(dir, { recursive: true, onlyFiles: true })
)

const files = await listFiles('./data')
await writeJson('./output/manifest.json', { port: env.PORT, files })
await logger.info('manifest written', { count: files.length })
```
