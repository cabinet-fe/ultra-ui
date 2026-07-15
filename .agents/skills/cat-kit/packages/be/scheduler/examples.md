# 任务调度 — 示例

```ts
import { Scheduler, getMemoryInfo, parseCron } from '@cat-kit/be'

const next = parseCron('*/5 * * * *').getNextDate()
void next

const scheduler = new Scheduler()
scheduler.interval('memory-check', 60_000, () => {
  console.log(getMemoryInfo().usedPercent)
})
scheduler.schedule('nightly', '0 2 * * *', async () => {
  /* ... */
})
scheduler.start()
```
