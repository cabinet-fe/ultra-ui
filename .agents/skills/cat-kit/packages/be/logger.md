# be — logger

结构化日志系统，支持多 Transport、自定义格式、日志轮转。

## Logger

```ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  constructor(options?: LoggerOptions)
}
```

### 配置选项

```ts
interface LoggerOptions {
  name?: string                    // 日志器名称
  level?: LogLevel                 // 最低输出级别，默认 INFO
  format?: 'text' | 'json'        // 输出格式，默认 text
  transports?: Transport[]         // 传输器列表，默认 [new ConsoleTransport()]
  context?: Record<string, any>    // 附加到每条日志的上下文
  timestampFormat?: string         // 默认 'yyyy-MM-dd HH:mm:ss'
  utc?: boolean                    // 是否使用 UTC，默认 false
  textFormat?: string | TextFormatter  // 自定义 text 格式
}
```

### 日志方法

| 方法 | 说明 |
|------|------|
| `.log(level, message, meta?, error?)` | 底层日志入口 |
| `.debug(message, meta?)` | DEBUG 级别 |
| `.info(message, meta?)` | INFO 级别 |
| `.warn(message, meta?)` | WARN 级别 |
| `.error(message, errorOrMeta?, meta?)` | ERROR 级别，智能参数：第二参数若是 Error 实例作为 error 对象，否则作为 meta |

```ts
import { Logger, ConsoleTransport } from '@cat-kit/be'

const log = new Logger({
  name: 'app',
  level: LogLevel.DEBUG,
  context: { service: 'api' }
})

log.info('server started', { port: 3000 })
log.warn('rate limit approaching', { remaining: 5 })
log.error('db connection failed', new Error('ECONNREFUSED'), { retries: 3 })
```

### JSON 格式

```ts
const log = new Logger({ format: 'json' })
log.info('user login', { userId: 123 })
// {"level":"info","message":"user login","timestamp":"2024-01-15 10:30:00","name":"app","meta":{"userId":123}}
```

## Transport

### ConsoleTransport

```ts
class ConsoleTransport implements Transport {
  constructor(options?: { useColors?: boolean; level?: LogLevel })
}
```

输出到控制台，默认根据级别着色（debug=cyan, info=green, warn=yellow, error=red）。

```ts
const transport = new ConsoleTransport({ useColors: false })
const log = new Logger({ transports: [transport] })
```

### FileTransport

```ts
class FileTransport implements Transport {
  constructor(options: { path: string; maxSize?: number; newline?: string; level?: LogLevel })
}
```

写入日志文件，支持两种模式：

- **目录模式**：`path` 以 `/` 结尾，按日期命名文件（`yyyy-MM-dd.log`）
- **文件模式**：`path` 是具体文件路径

`maxSize` 超限时自动轮转：目录模式添加时间戳后缀，文件模式添加 `.yyyy-MM-dd_HH-mm-ss` 后缀。

```ts
const fileTransport = new FileTransport({
  path: './logs/',      // 目录模式
  maxSize: 10 * 1024 * 1024  // 10MB 轮转
})

const log = new Logger({
  transports: [new ConsoleTransport(), fileTransport]
})
```

### 自定义 Transport

实现 `Transport` 接口即可：

```ts
interface Transport {
  level?: LogLevel
  write(entry: LogEntry, formatted: string, format: LogFormat): void | Promise<void>
}
```

```ts
const remoteTransport: Transport = {
  level: LogLevel.ERROR,
  async write(entry) {
    await fetch('https://log.example.com/ingest', {
      method: 'POST',
      body: JSON.stringify(entry)
    })
  }
}
```

> 类型签名：`../../generated/be/logger/`
