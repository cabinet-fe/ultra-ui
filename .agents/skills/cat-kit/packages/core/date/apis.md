# 日期 — API

```ts
declare function date(input?: DateInput): Dater

declare class Dater {
  constructor(date: DateInput)
  static parse(value: string, format?: string, options?: { utc?: boolean }): Dater
  readonly raw: Date
  readonly timestamp: number
  // getters: year, month, weekDay, day, hours, minutes, seconds
  setTime(timestamp: number): Dater
  setYear(year: number): Dater
  setMonth(month: number): Dater // 从 1 开始
  setDay(day: number): Dater
  setHours(hours: number): Dater
  setMinutes(minutes: number): Dater
  setSeconds(sec: number): Dater
  clone(): Dater
  format(formatter?: string, options?: { utc?: boolean }): string
  calc(timeStep: number, type?: DiffUnit): Dater
  addDays(n: number): Dater
  addWeeks(n: number): Dater
  addMonths(n: number): Dater
  addYears(n: number): Dater
  startOf(unit: StartEndUnit): Dater
  endOf(unit: StartEndUnit): Dater
  toEndOfMonth(): Dater
  diff(date: DateInput, unit?: DiffUnit, options?: DiffOptions): number
  isBefore(date: DateInput): boolean
  isAfter(date: DateInput): boolean
  isSame(date: DateInput, unit?: StartEndUnit): boolean
  isBetween(
    start: DateInput,
    end: DateInput,
    inclusive?: '()' | '[]' | '[)' | '(]'
  ): boolean
}
```

`DiffUnit`：`'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'`  
`StartEndUnit`：`'day' | 'week' | 'month' | 'year'`
