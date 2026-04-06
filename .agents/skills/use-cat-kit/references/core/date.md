# core — 日期处理

```typescript
import { date, Dater } from '@cat-kit/core'
```

## 构造与属性

接受 `number | string | Date | Dater`，不传则当前时间。

```typescript
const d = date('2024-01-15 10:30:45')
d.clone()  // 独立实例
```

属性：`d.year`, `d.month`(1-based), `d.day`, `d.weekDay`(0=周日), `d.hours`, `d.minutes`, `d.seconds`, `d.timestamp`, `d.raw`

## 格式化

```typescript
d.format('yyyy-MM-dd HH:mm:ss')
d.format('yyyy年M月d日')
d.format('yyyy-MM-dd HH:mm:ss', { utc: true })
```

占位符：`yyyy`(年) `M/MM`(月) `d/dd`(日) `H/HH`(24h) `h/hh`(12h) `m/mm`(分) `s/ss`(秒)

## 解析

```typescript
Dater.parse('2024-03-05 14:20:10', 'yyyy-MM-dd HH:mm:ss')
Dater.parse(value, format, { utc: true })
// 无效日期不抛错，用 Number.isNaN(d.timestamp) 检查
```

## 修改

可变（返回自身）：`setYear`, `setMonth`, `setDay`, `setHours`, `setMinutes`, `setSeconds`, `setTime`

不可变（返回新实例）：`addDays`, `addWeeks`, `addMonths`, `addYears`, `calc`, `startOf`, `endOf`

```typescript
d.calc(7)              // +7 天
d.calc(2, 'weeks')     // +2 周
d.addMonths(1)
d.startOf('day')       // 当天 00:00:00
d.endOf('month')       // 月末 23:59:59
```

## 比较

```typescript
a.compare(b)           // 天数差（向零取整）
a.diff(b, 'hours')
a.diff(b, 'days', { absolute: true })
a.isBetween('2024-01-10', '2024-01-31')  // inclusive 支持 '[]','()','[)','(]'
a.isSameDay(b)
a.isSameMonth(b)
a.isWeekend()
a.isLeapYear()
```

## 月份工具

```typescript
d.toEndOfMonth()   // 到当月最后一天（可变）
d.getDays()        // 当月天数
```
