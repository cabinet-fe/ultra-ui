import type { Dater } from 'cat-kit/'
import { shallowRef } from 'vue'

export function useRange() {
  const rangeDate = shallowRef<[Dater, Dater]>()

  function didInRange(date: Dater) {
    if (rangeDate.value?.length !== 2) return false
    const [start, end] = rangeDate.value
    return date.timestamp >= start.timestamp && date.timestamp <= end.timestamp
  }

  function didIsRangeStart(date: Dater, fmtStr: string) {
    if (rangeDate.value?.length !== 2) return false
    const [start] = rangeDate.value
    return date.format(fmtStr) === start.format(fmtStr)
  }

  function didIsRangeEnd(date: Dater, fmtStr: string) {
    if (rangeDate.value?.length !== 2) return false
    const [_, end] = rangeDate.value
    return date.format(fmtStr) === end.format(fmtStr)
  }

  function updateFirstRangeDate(date: Dater) {
    rangeDate.value = [date, date]
  }

  function updateSecondRangeDate(date: Dater) {
    if (!rangeDate.value) return

    if (date.timestamp < rangeDate.value[0].timestamp) {
      rangeDate.value = [date, rangeDate.value[0]]
    } else {
      rangeDate.value = [rangeDate.value[0], date]
    }
  }

  /** 处理日期悬停 */
  function handleDateHovered(date: Dater) {
    updateSecondRangeDate(date)
  }
}
