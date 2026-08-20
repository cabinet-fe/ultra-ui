# 日志 — API

```ts
declare enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

declare class Logger {
  constructor(options?: LoggerOptions)
  log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void>
  debug(message: string, meta?: Record<string, unknown>): Promise<void>
  info(message: string, meta?: Record<string, unknown>): Promise<void>
  warn(message: string, meta?: Record<string, unknown>): Promise<void>
  error(message: string, meta?: Record<string, unknown>): Promise<void>
}

declare class ConsoleTransport {
  constructor(options?: ConsoleTransportOptions)
}

declare class FileTransport {
  constructor(options: FileTransportOptions) // path, maxSize?, newline?, level?
}
```

`LoggerOptions`：`name`、`level`、`format`（`'text' | 'json'`）、`transports`、`context` 等，见 generated。
