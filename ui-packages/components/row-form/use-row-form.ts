import type { Row } from '@ui/types/components/row-form'
import { isReactive, shallowReactive } from 'vue'

export const useRowForm = () => {
  const wrapDataRows = (data: Record<string, any>[]) => {
    return data.map((item: Record<string, any>, index: number) => {
      return isReactive(item) ? item : shallowReactive(item)
    })
  }

  return { wrapDataRows }
}
