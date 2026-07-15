# core — 日期

## 何时使用

解析、格式化、加减、对齐、比较与区间判断。

## 推荐公开 API

- `date(input?)`、`Dater.parse(value, format?, { utc? })`
- 可变：`setTime`、`setYear`、`setMonth`、`setDay`、`setHours`、`setMinutes`、`setSeconds`、`toEndOfMonth`
- 不可变：`clone`、`calc`、`addDays|Weeks|Months|Years`、`startOf`、`endOf`
- `diff`、`isBefore`/`isAfter`/`isSame`/`isBetween`、`format`

```ts
import { date } from '@cat-kit/core'

date('2024-01-15').addWeeks(1).format('yyyy-MM-dd')
```

详情见 [apis.md](apis.md)。

## 约束

- 非法输入产生 Invalid Date / `NaN` 时间戳，不抛错
- `startOf('week')` 以周一为起点
- `diff` 的 month/year 为日历差；day/week 等按固定毫秒
- `isBetween` 接受反转边界，默认包容性 `[]`

## 类型入口

[date.d.ts](../../../generated/core/date/date.d.ts)
