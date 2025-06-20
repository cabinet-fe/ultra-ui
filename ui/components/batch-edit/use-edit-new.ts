import { nextTick, type ShallowRef, shallowRef } from 'vue'
import type { BatchEditEmits, BatchEditProps, TableRow } from '@ui/types'

interface EditReturned {
  currentRow: ShallowRef<TableRow | undefined>
  handleEdit: (row: TableRow, e: MouseEvent) => Promise<void>
  handleAdd: (row: TableRow, e: MouseEvent) => Promise<void>
  handleCopy: (row: TableRow, e: MouseEvent) => Promise<void>
  handleDelete: (row: TableRow) => Promise<void>
}

export function useEdit(options: {
  props: BatchEditProps
  emit: BatchEditEmits
}): EditReturned {
  const { props, emit } = options

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
    setCurrentRow(row)
  }

  async function handleEdit(row: TableRow, e: MouseEvent) {
    setCurrentRow(row)
  }

  async function handleCopy(row: TableRow, e: MouseEvent) {
    console.log(row, e)
  }

  async function handleDelete(row: TableRow) {
    emit('update:data', props.data?.filter((_, i) => i !== row.index) ?? [])
  }

  return {
    currentRow,
    handleEdit,
    handleAdd,
    handleCopy,
    handleDelete
  }
}
