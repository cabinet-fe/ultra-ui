# @cat-kit/be 示例

以下片段假定运行在支持 top-level `await` 的异步上下文中（或包在 `async` 函数内）。

```ts
import { ensureDir } from '@cat-kit/be'

await ensureDir('./var/data')
```

```ts
import { Logger, ConsoleTransport } from '@cat-kit/be'

const log = new Logger({ name: 'app', transports: [new ConsoleTransport()] })
await log.info('ready')
```

详见 [`generated/index.d.ts`](generated/index.d.ts)。
