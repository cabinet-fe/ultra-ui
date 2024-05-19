import { shallowRef, useSlots, type VNode } from 'vue'
import type {
  TableColumnRenderContext,
  TableColumnSlotsScope,
  TableEmits,
  TableProps
} from '@ui/types/components/table'
import type { ColumnNode } from './use-columns'
import { bem, type BEM } from '@ui/utils'
import { getChainValue } from 'cat-kit/fe'
import type { TableRow } from './use-rows'

interface Options<DataItem extends Record<string, any> = Record<string, any>> {
  props: TableProps<DataItem>
  emit: TableEmits<DataItem>
  cls: BEM<'table'>
}

export function useTable(options: Options) {
  const { props, cls, emit } = options

  const slots = useSlots()

  const getColumnSlotsNode = (
    ctx: TableColumnSlotsScope | TableColumnRenderContext
  ): VNode[] | undefined => {
    const { column } = ctx

    const result =
      column.value.render?.(ctx) ??
      (props.slots ?? slots)[`column:${column.key}`]?.(ctx) ??
      ctx.val

    return result
  }

  const getHeaderSlotsNode = (ctx: {
    column: ColumnNode
  }): VNode[] | undefined | string | VNode => {
    const { column } = ctx
    return (
      column.value.nameRender?.(ctx) ??
      (props.slots ?? slots)[`header:${ctx.column.key}`]?.(ctx) ??
      ctx.column.name
    )
  }

  const getCellClass = (column: ColumnNode): string => {
    const classList: string[] = [cls.e('cell'), bem.is(column.align)]

    column.fixed && classList.push(bem.is('fixed-' + column.fixed))
    column.isLastFixed && classList.push(bem.is('last-fixed'))
    column.isFirstFixed && classList.push(bem.is('first-fixed'))
    return classList.join(' ')
  }

  const getCellCtx = (
    row: TableRow,
    column: ColumnNode
  ): TableColumnSlotsScope | TableColumnRenderContext => {
    const rowData = row.value
    const val = getChainValue(rowData, column.key)
    const ctx = {
      row,
      column,
      rowData,
      val,
      model: slots[`column:${column.key}`]
        ? {
            modelValue: val,
            'onUpdate:modelValue': (val: any) => {
              rowData[column.key] = val
            }
          }
        : undefined
    }

    return ctx
  }

  const currentRow = shallowRef<TableRow>()

  const handleRowClick = (row: TableRow) => {
    emit('row-click', row)

    if (!props.highlightCurrent) return

    if (currentRow.value) {
      currentRow.value.isCurrent = false
    }
    if (row === currentRow.value) {
      currentRow.value = undefined
    } else {
      currentRow.value = row
      row.isCurrent = true
    }

    emit('current-row-change', currentRow.value)
  }

  return {
    /**
     * 获取列插槽VNode
     * @param ctx 列渲染上下文
     */
    getColumnSlotsNode,
    /**
     * 获取表头插槽VNode
     * @param ctx 表头渲染上下文
     */
    getHeaderSlotsNode,
    /**
     * 获取单元格类名
     * @param column 列
     */
    getCellClass,
    /**
     * 获取单元格上下文
     * @param row 行
     * @param column 列
     */
    getCellCtx,

    /** 行点击 */
    handleRowClick
  }
}
