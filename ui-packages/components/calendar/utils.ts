import { type Dater, date } from 'cat-kit/fe'
import type { Day } from '@ui/types/components/calendar'

export const weekDays = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 获取一个月的天数
 * @param d 日期
 * @param disabledDate 禁用日期
 * @returns
 */
export function getMonthDays(
  d: Date | string | number | Dater,
  disabledDate?: (d: Dater) => boolean
) {
  const todayStr = date().format()
  if (d instanceof Date || typeof d === 'string' || typeof d === 'number') {
    d = date(d)
  }

  // 本月天数
  d.setDay(1)
  const currentMonthDays: Day[] = Array.from({ length: d.getDays() }).map(
    (_, i) => {
      const day: Day = {
        date: d.calc(i, 'days'),
        type: 'current'
      }
      day.isToday = day.date.format() === todayStr
      day.disabled = disabledDate?.(day.date)
      return day
    }
  )

  const preMonthDays: Day[] = []

  const nextMonthDays: Day[] = []

  // 上月天数
  const firstDayWeek = d.weekDay

  if (firstDayWeek !== 0) {
    // 上个月最后一天
    d.setDay(0)
    let i = 0
    while (i < firstDayWeek) {
      const day: Day = {
        date: d.calc(-i, 'days'),
        type: 'pre'
      }
      day.disabled = disabledDate?.(day.date)
      preMonthDays.unshift(day)
      i++
    }
  }

  // 下个月的天数
  const nextMonthDaysAmount = 42 - currentMonthDays.length - preMonthDays.length

  let j = 0
  d.setMonth(d.month + 2).setDay(1)

  while (j < nextMonthDaysAmount) {
    const day: Day = {
      date: d.calc(j++, 'days'),
      type: 'next'
    }
    day.disabled = disabledDate?.(day.date)
    nextMonthDays.push(day)
  }

  return [...preMonthDays, ...currentMonthDays, ...nextMonthDays]
}

/**
 * 获取一年的月份
 * @param d 日期
 * @param disabledDate 禁用的日期
 * @returns
 */
export function getYearMonths(
  d: Date | string | number | Dater,
  disabledDate?: (d: Dater) => boolean
): Array<{
  key: string
  month: number
  disabled?: boolean
}> {
  if (d instanceof Date || typeof d === 'string' || typeof d === 'number') {
    d = date(d)
  }

  const year = d.year

  return Array.from({ length: 12 }).map((_, i) => {
    const month = i + 1
    return {
      key: `${year}-${month}`,
      month,
      disabled: disabledDate?.(d.calc(month - d.month, 'months'))
    }
  })
}

/**
 * 获取当前年份所处的10年
 * @param d 日期
 * @param disabledDate 禁用的日期
 * @returns
 */
export function getTenYears(
  d: Date | string | number | Dater,
  disabledDate?: (d: Dater) => boolean
) {
  if (d instanceof Date || typeof d === 'string' || typeof d === 'number') {
    d = date(d)
  }

  const startYear = d.year - (d.year % 10) + 1

  return Array.from({ length: 10 }).map((_, i) => {
    const year = startYear + i
    return {
      year,
      disabled: disabledDate?.(d.calc(year - d.year, 'years'))
    }
  })
}
