# be — 日志系统

```typescript
import { createLogger } from '@cat-kit/be'

const logger = createLogger({
  level?: 'debug' | 'info' | 'warn' | 'error',
  prefix?, timestamp?, color?, output?
})

logger.debug('detail')
logger.info('message')
logger.warn('warning')
logger.error('error', error)

const child = logger.child({ prefix: 'HTTP' })
```
