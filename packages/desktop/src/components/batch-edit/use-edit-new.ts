import { nextTick, type ShallowRef, shallowRef } from 'vue'
import type { BatchEditEmits, BatchEditProps, TableRow } from '@ultra-ui/desktop/types'
import type { TipReturned } from './use-tip'

interface EditReturned {
  currentRow: ShallowRef<TableRow | undefined>
  handleEdit: (row: TableRow, e: MouseEvent) => Promise<void>
  handleAdd: (row: TableRow, e: MouseEvent) => Promise<void>
  handleCopy: (row: TableRow, e: MouseEvent) => Promise<void>
  handleDelete: (row: TableRow) => Promise<void>
  handleView: (row: TableRow, e: MouseEvent) => void
}

export function useEdit(options: {
  props: BatchEditProps
  emit: BatchEditEmits
  open: TipReturned['open']
}): EditReturned {
  const { props, emit, open } = options

  /**
   * 当前操作行
   */
  const currentRow = shallowRef<TableRow>()

  async function setCurrentRow(row: TableRow): Promise<TableRow | undefined> {
    // 重复点击，则清空
    if (row === currentRow.value) {
      currentRow.value = undefined
      return
    }
    if (!currentRow.value) {
      currentRow.value = row
      return
    }
    currentRow.value = undefined
    await nextTick()
    currentRow.value = row
    return row
  }

  async function handleAdd(row: TableRow, e: MouseEvent) {
    open('create', e.currentTarget as HTMLElement)
    setCurrentRow(row)
  }

  async function handleEdit(row: TableRow, e: MouseEvent) {
    open('update', e.currentTarget as HTMLElement)
    setCurrentRow(row)
  }

  async function handleCopy(row: TableRow, e: MouseEvent) {
    open('copy', e.currentTarget as HTMLElement)
    setCurrentRow(row)
  }

  async function handleDelete(row: TableRow) {
    emit('update:data', props.data?.filter((_, i) => i !== row.index) ?? [])
  }

  function handleView(row: TableRow, e: MouseEvent) {
    open('view', e.currentTarget as HTMLElement)
    setCurrentRow(row)
  }

  return {
    currentRow,
    handleEdit,
    handleAdd,
    handleCopy,
    handleDelete,
    handleView
  }
}
