# be — 日志

## 何时使用

结构化控制台或文件日志，带级别与多 Transport。

## 推荐公开 API

`Logger`、`LogLevel`、`ConsoleTransport`、`FileTransport`

```ts
import { FileTransport, Logger, LogLevel } from '@cat-kit/be'

const logger = new Logger({
  level: LogLevel.INFO,
  format: 'json',
  transports: [new FileTransport({ path: './logs/app.log' })]
})
await logger.info('service started')
```

详情见 [apis.md](apis.md)。

## 约束

`log`/`debug`/`info`/`warn`/`error` 均返回 `Promise<void>`。

## 类型入口

[logger.d.ts](../../../generated/be/logger/logger.d.ts) · [transports.d.ts](../../../generated/be/logger/transports.d.ts)
