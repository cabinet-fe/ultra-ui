import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { defineComponent, type DefineComponent, type VNodeRef } from 'vue'
import { inject } from 'vue'
import type { JSX } from 'vue/jsx-runtime'

import type { TableRow as ITableRow } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'
import { TableDIKey } from './di'
import UTabelCell from './table-cell.vue'

export const UTableRow: DefineComponent<{ row: ITableRow }> = defineComponent({
  name: 'TableRow',

  props: ['row'],

  setup(props) {
    const { row } = props

    const {
      cls,
      columnConfig,
      getColumnSlotsNode,
      toggleTreeRowExpand,
      getCellCtx,
      handleRowClick,
      handleCellClick,
      tableProps,
      measureElement
    } = inject(TableDIKey)!

    const { columns, expandColumn } = columnConfig

    return () => {
      const _expandColumn = expandColumn.value

      let expandCell: JSX.Element | null = null
      if (_expandColumn) {
        const expandCtx = getCellCtx(row, _expandColumn)
        const cellSpan = tableProps.mergeCell?.(expandCtx)

        if (!cellSpan || (cellSpan.colspan && cellSpan.rowspan)) {
          const marginLeft = tableProps.tree ? (row.depth - 1) * 14 : 0
          expandCell = (
            <UTabelCell
              column={_expandColumn}
              left={_expandColumn.style.left}
              right={_expandColumn.style.right}
              key={row.uid + _expandColumn.key}
              {...tableProps.mergeCell?.(expandCtx)}
            >
              {!row.isLeaf || (tableProps.expandable && !row.isExpandRow) ? (
                <UButton
                  text
                  class={cls.e('expand-toggle')}
                  type='primary'
                  size='small'
                  circle
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTreeRowExpand(row)
                  }}
                  style={`margin-left: ${marginLeft}px`}
                >
                  <UIcon>
                    <ArrowRight />
                  </UIcon>
                </UButton>
              ) : (
                <i class={cls.e('expand-space')} style={`margin-left: ${marginLeft}px`}></i>
              )}

              {getColumnSlotsNode(expandCtx)}
            </UTabelCell>
          )
        }
      }

      return (
        <tr
          class={[cls.e('row'), bem.is('expanded', row.expanded), bem.is('checked', row.checked)]}
          onClick={(e) => handleRowClick(row, e)}
          ref={measureElement as VNodeRef}
          key={row.uid}
        >
          {expandCell}

          {columns.value.map((column) => {
            const cellCtx = getCellCtx(row, column)
            const cellSpan = tableProps.mergeCell?.(cellCtx)
            if (cellSpan && (!cellSpan.colspan || !cellSpan.rowspan)) {
              return null
            }

            const cellNode = getColumnSlotsNode(cellCtx)

            return (
              <UTabelCell
                column={column}
                left={column.style.left}
                right={column.style.right}
                key={row.uid + column.key}
                // @ts-ignore
                onClick={(e) => handleCellClick(row, column, e)}
                {...cellSpan}
              >
                {cellNode}
              </UTabelCell>
            )
          })}
        </tr>
      )
    }
  }
})

export const UExpandTableRow = defineComponent({
  name: 'ExpandTableRow',
  props: ['row'],
  setup(props) {
    const { getExpandRowSlotsNode, cls, measureElement, columnConfig } = inject(TableDIKey)!
    const { leafColumns } = columnConfig

    return () => {
      const { row } = props
      const node = getExpandRowSlotsNode({
        row,
        index: row.index,
        columns: leafColumns.value,
        rowData: row.data
      })
      return (
        <tr class={cls.e('row')} ref={measureElement as VNodeRef}>
          <td colspan={leafColumns.value.length} class={cls.e('cell')}>
            {node}
          </td>
        </tr>
      )
    }
  }
})
