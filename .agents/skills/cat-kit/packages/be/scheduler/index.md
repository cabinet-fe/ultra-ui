# be — 任务调度

## 何时使用

Cron 表达式、延迟或周期任务。

## 推荐公开 API

`CronExpression`、`parseCron`、`Scheduler`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- Cron 五段、本地时区；日与周字段需同时匹配；最多向前搜索 100_000 分钟
- 任务 ID 唯一；异常 `console.error` 不重抛；`stop()` 不取消已在跑的任务

## 类型入口

[cron.d.ts](../../../generated/be/scheduler/cron.d.ts) · [scheduler.d.ts](../../../generated/be/scheduler/scheduler.d.ts)
