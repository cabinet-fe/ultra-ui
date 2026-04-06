# be — 任务调度

```typescript
import { Scheduler, CronExpression } from '@cat-kit/be'

const scheduler = new Scheduler()

const id = scheduler.addTask({
  name: 'cleanup',
  cron: '0 0 * * *',
  handler: async () => {},
  immediate?, timezone?, maxRetries?, retryDelay?
})

scheduler.start()
scheduler.removeTask(id)
scheduler.pauseTask(id)
scheduler.resumeTask(id)
scheduler.stop()
scheduler.getStatus()
scheduler.getTaskStatus(id)

CronExpression.parse('*/5 * * * *')
CronExpression.next('0 0 * * *')
CronExpression.validate('* * * * *')
```
