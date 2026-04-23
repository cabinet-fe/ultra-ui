import { o } from '@cat-kit/core'
import { bem, type BEM } from '@veltra/utils'
import { useSlots, watch, type Ref } from 'vue'

import type {
  TableColumnRenderContext,
  TableColumnSlotsScope,
  TableProps,
  TableRow,
  RenderReturn,
  TableRowSlotsScope
} from '../../types'
import type { ColumnNode } from './node/col'

interface Options {
  props: TableProps
  cls: BEM<'table'>
  leftFixed: Ref<boolean>
  rightFixed: Ref<boolean>
}

interface UseTableReturn {
  getColumnSlotsNode: (ctx: TableColumnSlotsScope | TableColumnRenderContext) => RenderReturn
  getHeaderSlotsNode: (ctx: { column: ColumnNode }) => RenderReturn
  getExpandRowSlotsNode: (ctx: TableRowSlotsScope) => RenderReturn
  getCellClass: (column: ColumnNode) => string
  getHeaderCellClass: (column: ColumnNode) => string
  getCellCtx: (
    row: TableRow,
    column: ColumnNode
  ) => TableColumnSlotsScope | TableColumnRenderContext
}

export function useTable(options: Options): UseTableReturn {
  const { props, cls, leftFixed, rightFixed } = options

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

  const getExpandRowSlotsNode = (ctx: TableRowSlotsScope): RenderReturn => {
    const slotsRender = props.slots?.['row:expand'] ?? slots['row:expand']

    if (slotsRender) return slotsRender(ctx)
    return null
  }

  const cellCls = cls.e('cell')

  const getCommonClassName = (column: ColumnNode): string => {
    const classList: string[] = [cellCls]

    leftFixed.value && column.isLastFixed && classList.push(bem.is('last-fixed'))

    rightFixed.value && column.isFirstFixed && classList.push(bem.is('first-fixed'))

    if (column.fixed) {
      classList.push(bem.is('fixed-' + column.fixed))
    }
    return classList.join(' ')
  }

  /**
   * B1: 单元格类名按 ColumnNode 身份缓存。
   *
   * 对同一列，类名只取决于 (column.fixed, column.isLastFixed, column.isFirstFixed,
   * column.align, leftFixed, rightFixed)。其中前四个绑定在 ColumnNode 实例上，
   * 后两个在 leftFixed/rightFixed 变化时失效缓存即可。用 WeakMap 以 ColumnNode
   * 为键可避免字符串 key 的拼接/哈希开销，且列树重建时节点随 GC 自动释放。
   */
  let cellClassCache = new WeakMap<ColumnNode, string>()
  let headerCellClassCache = new WeakMap<ColumnNode, string>()

  watch([leftFixed, rightFixed], () => {
    cellClassCache = new WeakMap()
    headerCellClassCache = new WeakMap()
  })

  const getCellClass = (column: ColumnNode): string => {
    const cached = cellClassCache.get(column)
    if (cached !== undefined) return cached
    const result = getCommonClassName(column) + ` ${bem.is(column.align)}`
    cellClassCache.set(column, result)
    return result
  }

  const getHeaderCellClass = (column: ColumnNode): string => {
    const cached = headerCellClassCache.get(column)
    if (cached !== undefined) return cached
    const result = getCommonClassName(column) + ` ${bem.is(column.headerAlign)}`
    headerCellClassCache.set(column, result)
    return result
  }

  const getCellCtx = (
    row: TableRow,
    column: ColumnNode
  ): TableColumnSlotsScope | TableColumnRenderContext => {
    const rowData = row.data
    const val = column.key ? o(rowData).get(column.key) : undefined

    const ctx = {
      row,
      column,
      rowData,
      val,
      model: {
        modelValue: val,
        'onUpdate:modelValue': (val: any) => {
          rowData[column.key] = val
        }
      }
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
     * 获取展开行插槽VNode
     * @param ctx 展开行渲染上下文
     */
    getExpandRowSlotsNode,
    /**
     * 获取单元格类名
     * @param column 列
     */
    getCellClass,
    /**
     * 获取表头单元格类名
     * @param column 列
     */
    getHeaderCellClass,
    /**
     * 获取单元格上下文
     * @param row 行
     * @param column 列
     */
    getCellCtx
  }
}
