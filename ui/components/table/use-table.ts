import { useSlots } from 'vue'
import type {
  TableColumnRenderContext,
  TableColumnSlotsScope,
  TableProps
} from '@ui/types/components/table'
import type { ColumnNode } from './use-columns'
import { bem, type BEM } from '@ui/utils'
import { getChainValue } from 'cat-kit/fe'
import type { TableRow } from './use-rows'
import type { RenderReturn } from '@ui/types/helper'

interface Options<DataItem extends Record<string, any> = Record<string, any>> {
  props: TableProps<DataItem>
  cls: BEM<'table'>
}

export function useTable(options: Options) {
  const { props, cls } = options

  const slots = useSlots()

  const getColumnSlotsNode = (
    ctx: TableColumnSlotsScope | TableColumnRenderContext
  ): RenderReturn => {
    const column = ctx.column.data

    const { render, key } = column

    if (render) return render(ctx)

    const slotsRender = props.slots?.[`column:${key}`] ?? slots[`column:${key}`]

    if (slotsRender) return slotsRender(ctx)
    return ctx.val
  }

  const getHeaderSlotsNode = (ctx: { column: ColumnNode }): RenderReturn => {
    const column = ctx.column.data
    const { nameRender, key } = column

    if (nameRender) return nameRender(ctx)

    const slotsRender = props.slots?.[`header:${key}`] ?? slots[`header:${key}`]

    if (slotsRender) return slotsRender(ctx)

    return column.name
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
    const rowData = row.data
    const val = column.key ? getChainValue(rowData, column.key) : undefined
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
    getCellCtx
  }
}
