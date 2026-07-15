# 任务调度 — API

```ts
declare class CronExpression {
  constructor(expression: string)
  getNextDate(from?: Date): Date | null
}

declare function parseCron(expression: string): CronExpression

declare class Scheduler {
  schedule(id: string, expression: string, fn: TaskFunction): void
  once(id: string, delayMs: number, fn: TaskFunction): void
  interval(id: string, intervalMs: number, fn: TaskFunction): void
  cancel(id: string): boolean
  start(): void
  stop(): void
  getTask(id: string): TaskInfo | undefined
  getTasks(): TaskInfo[]
}
```
