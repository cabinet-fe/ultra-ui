# be — scheduler

任务调度器，支持 Cron 定时任务、延迟执行、定时间隔。

## Scheduler

```ts
class Scheduler {
  constructor()
}
```

### 添加任务

```ts
// Cron 定时任务
.schedule(id: string, cron: string | CronExpression, task: TaskFunction): void

// 延迟执行一次
.once(id: string, delay: number, task: TaskFunction): void

// 定时间隔重复
.interval(id: string, interval: number, task: TaskFunction): void
```

- `delay < 0` 或 `interval <= 0` 抛错
- 同一 id 重复添加会覆盖旧任务
- Task 执行失败 `console.error`，不中断调度器

### 控制方法

| 方法 | 说明 |
|------|------|
| `.start()` | 启动调度器 |
| `.stop()` | 停止调度器（保留任务，可恢复） |
| `.cancel(id)` | 取消指定任务 |

### 查询方法

| 方法 | 说明 |
|------|------|
| `.getTask(id)` | 返回任务信息（含 id、type、nextRun、running） |
| `.getTasks()` | 返回所有任务信息列表 |

```ts
import { Scheduler } from '@cat-kit/be'

const scheduler = new Scheduler()

// 每小时执行
scheduler.schedule('cleanup', '0 * * * *', async () => {
  await cleanupTempFiles()
})

// 5 分钟后执行一次
scheduler.once('warmup', 5 * 60 * 1000, () => {
  console.log('warming up...')
})

// 每 30 秒执行
scheduler.interval('health', 30_000, () => {
  checkHealth()
})

scheduler.start()
// scheduler.stop()
```

## CronExpression

```ts
class CronExpression {
  constructor(expression: string)
}

function parseCron(expression: string): CronExpression
```

标准 5 位 Cron 表达式解析（分 时 日 月 周）。

- 通配符：`*`、`?`
- 范围：`-`（如 `1-5`）
- 步长：`/`（如 `*/5`）
- 列表：`,`（如 `1,3,5`）

```ts
import { CronExpression } from '@cat-kit/be'

const expr = new CronExpression('0 */2 * * 1-5')  // 工作日每两小时
const next = expr.getNextDate()  // 下次执行时间
```

> 类型签名：`../../generated/be/scheduler/`
