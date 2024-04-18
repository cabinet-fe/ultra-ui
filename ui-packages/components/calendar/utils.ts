import { type Dater, date } from 'cat-kit/fe'

interface Day {
  date: Dater
  isToday?: boolean
  type: 'pre' | 'current' | 'next'
}

export const weekDays = ['日', '一', '二', '三', '四', '五', '六']

export function getMonthDays(d: Date | string | number) {
  const preMonthDays: Day[] = []
  const currentMonthDays: Day[] = []
  const nextMonthDays: Day[] = []

  const todayStr = date().format('yyyy-MM-dd')
  if (typeof d === 'string' || typeof d === 'number') {
    d = new Date(d)
  }

  // 本月第一天
  d.setDate(1)
  const firstDayWeek = d.getDay()

  if (firstDayWeek !== 0) {
    let i = firstDayWeek
    // 上个月最后一天
    d.setDate(0)

    while (i > 0) {
      const day: Day = {
        date: date(d.getTime()),
        type: 'pre'
      }
      preMonthDays.unshift(day)
      d.setDate(day.date.day - 1)
      i--
    }
  }

  // 获取本月的天数
  d.setMonth(d.getMonth() + 2)
  d.setDate(0)

  const daysNum = d.getDate()
  let i = 1
  while (i <= daysNum) {
    d.setDate(i)
    i++
    const day: Day = {
      date: date(d.getTime()),
      type: 'current'
    }
    day.isToday = day.date.format('yyyy-MM-dd') === todayStr
    currentMonthDays.push(day)
  }

  // 下个月的天数
  const nextMonthDaysAmount = 42 - currentMonthDays.length - preMonthDays.length

  let j = 1
  d.setDate(i)
  while (j <= nextMonthDaysAmount) {
    d.setDate(j)
    j++
    const day: Day = {
      date: date(d.getTime()),
      type: 'next'
    }
    nextMonthDays.push(day)
  }

  return [...preMonthDays, ...currentMonthDays, ...nextMonthDays]
}
