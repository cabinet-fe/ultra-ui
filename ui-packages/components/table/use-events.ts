import type { TableEmits, TableRow } from '@ui/types/components/table'

interface Options<DataItem extends Record<string, any>> {
  emit: TableEmits<DataItem>
}

export type EventHandlers<DataItem extends Record<string, any>> = {
  /** 鼠标移入事件 */
  handleMouseEnter: (e: MouseEvent) => void
  /** 行点击事件 */
  handleRowClick: (row: TableRow<DataItem>) => void
}

export function useEvents<DataItem extends Record<string, any>>(
  options: Options<DataItem>
): EventHandlers<DataItem> {
  const { emit } = options

  const handleMouseEnter = (e: MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.nodeName !== 'TD') return
  }

  const handleRowClick = (row: TableRow<DataItem>) => {
    emit('row-click', row)
  }

  return {
    handleMouseEnter,
    handleRowClick
  }
}
