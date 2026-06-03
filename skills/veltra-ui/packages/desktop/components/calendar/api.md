# UCalendar — 日历

> `import type { CalendarProps, CalendarEmits, CalendarExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/calendar.ts`

## Import

```ts
// UCalendar 由 Vite 自动导入，无需手动 import
```

## 相关类型

```ts
interface CalendarDay {
  date: Dater // @cat-kit/core 的 Dater 实例
  isToday?: boolean // 是否今日
  type: 'pre' | 'current' | 'next' // 日期类型：上月 / 本月 / 下月
  disabled?: boolean // 是否禁止选择
}
```

> 示例见 [examples.md](./examples.md)
