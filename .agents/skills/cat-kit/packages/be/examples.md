# @cat-kit/be 示例

## 文件系统

```ts
import { readDir, ensureDir, removePath, readJson, writeJson, movePath } from '@cat-kit/be'

// 递归读取目录
const entries = await readDir('./src', { filter: e => e.isFile && e.name.endsWith('.ts') })

// 确保目录存在
await ensureDir('./dist/assets')

// 读写 JSON
const config = await readJson<{ port: number }>('./config.json')
await writeJson('./config.json', { ...config, port: 8080 })

// 移动文件
await movePath('./old.json', './new.json', { overwrite: true })

// 删除
await removePath('./temp', { force: true })
```

## 日志

```ts
import { Logger, ConsoleTransport, FileTransport } from '@cat-kit/be'

const log = new Logger({
  name: 'app',
  transports: [
    new ConsoleTransport(),
    new FileTransport({ path: './logs/', maxSize: 10 * 1024 * 1024 })
  ]
})

log.info('server started', { port: 3000 })
log.error('db error', new Error('ECONNREFUSED'), { retries: 3 })
```

## 缓存

```ts
import { LRUCache, FileCache, memoize } from '@cat-kit/be'

// 内存缓存
const cache = new LRUCache<string, any>({ maxSize: 500, ttl: 5 * 60_000 })
cache.set('user:1', { name: 'Alice' })

// 文件缓存
const fileCache = new FileCache({ dir: './cache/api', ttl: 30 * 60_000 })
const cached = await fileCache.get('list')
if (cached) return cached

// 函数记忆化
const getUser = memoize(async (id: number) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}, { ttl: 60_000 })
```

## 配置管理

```ts
import { loadEnv, parseEnv, loadConfig, mergeConfig } from '@cat-kit/be'

// 加载 .env 文件
await loadEnv({ mode: 'production' })

// 类型安全的 env 校验
const env = parseEnv({
  PORT: { type: 'number', default: 3000 },
  DATABASE_URL: { type: 'string', required: true },
  DEBUG: { type: 'boolean', default: false },
})

// 加载 YAML/JSON/TOML 配置
const config = await loadConfig('./config/app.yml', {
  defaults: { port: 3000 }
})

// 深度合并
const merged = mergeConfig(defaults, userConfig)
```

## 网络工具

```ts
import { getLocalIP, isPortAvailable } from '@cat-kit/be'

const ip = getLocalIP()
const port = 3000
if (await isPortAvailable(port)) {
  console.log(`Server running at http://${ip}:${port}`)
}
```

## 系统信息

```ts
import { getCpuInfo, getCpuUsage, getMemoryInfo, getDiskInfo } from '@cat-kit/be'

const cpu = getCpuInfo()
console.log(`${cpu.model} (${cpu.cores} cores)`)

const usage = await getCpuUsage()
console.log(`CPU: ${usage.percent}%`)

const mem = getMemoryInfo()
console.log(`Memory: ${mem.usedPercent}%`)

const disk = await getDiskInfo()
console.log(`Disk: ${disk.usedPercent}%`)
```

## 任务调度

```ts
import { Scheduler } from '@cat-kit/be'

const scheduler = new Scheduler()

scheduler.schedule('cleanup', '0 3 * * *', async () => {
  await cleanupOldLogs()
})

scheduler.once('warmup', 30_000, () => console.log('ready'))
scheduler.interval('health', 60_000, () => checkHealth())

scheduler.start()
```

> 类型参考：`../../generated/be/index.d.ts`
