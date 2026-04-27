# core — date

基于 `Dater` 类的日期/时间工具，支持格式化、计算、比较、差值等操作。所有方法不可变（返回新 `Dater` 实例）。

## `date` 工厂函数

```ts
function date(d?: DateInput): Dater
```

创建 `Dater` 实例。`DateInput` 类型：`number`（时间戳）、`string`、`Date`、`Dater`。不传参时使用当前时间。

```ts
import { date } from '@cat-kit/core'

date()                    // 当前时间
date(1700000000000)       // 时间戳
date('2024-01-15')        // 日期字符串
```

## Dater 实例

### 属性读取

| 属性 | 类型 | 说明 |
|------|------|------|
| `.raw` | `Date` | 原始 Date 对象 |
| `.timestamp` | `number` | 时间戳（ms） |
| `.year` | `number` | 年份 |
| `.month` | `number` | 月份（1-12） |
| `.weekDay` | `number` | 星期几（0=周日, 6=周六） |
| `.day` | `number` | 日（1-31） |
| `.hours` | `number` | 小时（0-23） |
| `.minutes` | `number` | 分钟（0-59） |
| `.seconds` | `number` | 秒（0-59） |

### 属性设置

| 方法 | 说明 |
|------|------|
| `.setTime(ts)` | 设置时间戳 |
| `.setYear(y)` | 设置年份 |
| `.setMonth(m)` | 设置月份 |
| `.setDay(d)` | 设置日期 |
| `.setHours(h)` | 设置小时 |
| `.setMinutes(m)` | 设置分钟 |
| `.setSeconds(s)` | 设置秒 |

### 格式化

```ts
.format(fmt?: string, opts?: { utc?: boolean }): string
```

默认格式 `'yyyy-MM-dd'`，格式符：`yyyy`/`YYYY`、`MM`、`M`、`dd`、`d`、`DD`（中文星期）、`HH`/`H`（24h）、`hh`/`h`（12h）、`mm`/`m`、`ss`/`s`。

```ts
date('2024-01-15').format()                  // '2024-01-15'
date('2024-01-15').format('yyyy年MM月dd日')   // '2024年01月15日'
date('2024-01-15 14:30:00').format('HH:mm')  // '14:30'
```

### `Dater.parse`

```ts
static parse(value: string, format?: string, opts?: { utc?: boolean }): Dater
```

按格式解析日期字符串。格式符与 `.format()` 一致。

```ts
Dater.parse('2024年01月15日', 'yyyy年MM月dd日')
Dater.parse('15/01/2024', 'dd/MM/yyyy')
```

### 日期计算

| 方法 | 说明 |
|------|------|
| `.calc(step, type)` | 不可变计算。type: `'days'` \| `'weeks'` \| `'months'` \| `'years'` |
| `.addDays(n)` | n 天后 |
| `.addWeeks(n)` | n 周后 |
| `.addMonths(n)` | n 月后 |
| `.addYears(n)` | n 年后 |

步长可为负数（向前计算）。

```ts
date('2024-01-31').addMonths(1)  // 2024-02-29
date('2024-01-31').addMonths(-1) // 2023-12-31
```

### 对齐

| 方法 | 说明 |
|------|------|
| `.startOf('day' \| 'week' \| 'month' \| 'year')` | 对齐到单位起始 |
| `.endOf('day' \| 'week' \| 'month' \| 'year')` | 对齐到单位末尾 |
| `.toEndOfMonth(offset?)` | 跳转至月尾，`offset` 为月份偏移 |

### 比较

| 方法 | 说明 |
|------|------|
| `.compare(date)` | 比较日期，返回天数差（向零取整） |
| `.compare(date, reducer)` | 自定义比较 reducer |
| `.diff(date, unit?, opts?)` | 精确差值。unit: `'ms'` \| `'sec'` \| `'min'` \| `'hour'` \| `'day'` \| `'week'` \| `'month'` \| `'year'`（默认 `'day'`）。opts: `{ absolute?, float? }` |
| `.isBetween(start, end, opts?)` | 是否在区间内。opts: `{ inclusive? }`，默认 `'[]'`（闭区间） |
| `.isSameDay(date)` | 同一天 |
| `.isSameMonth(date)` | 同一月 |
| `.isSameYear(date)` | 同一年 |

```ts
date('2024-01-15').diff(date('2024-02-15'))               // 31
date('2024-01-15').diff(date('2024-02-15'), 'month')      // 1
date('2024-01-15').diff(date('2024-02-15'), 'month', { float: true }) // 1.0
date('2024-01-15').isBetween(date('2024-01-01'), date('2024-01-31')) // true
```

### 工具方法

| 方法 | 说明 |
|------|------|
| `.clone()` | 克隆新实例 |
| `.isWeekend()` | 是否为周六/周日 |
| `.isLeapYear()` | 是否为闰年 |
| `.getDays()` | 获取当月天数 |

> 类型签名：`../../generated/core/date/date.d.ts`
