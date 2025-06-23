import { defineComponent, type DefineComponent, type VNodeRef } from 'vue'
import { inject } from 'vue'
import { TableDIKey } from './di'
import UTabelCell from './table-cell.vue'
import { bem } from '@ui/utils'
import { ArrowRight } from 'icon-ultra'
import { UButton } from '../button'
import { UIcon } from '../icon'
import type { JSX } from 'vue/jsx-runtime'
import type { TableRow as ITableRow } from '@ui/types'

const TableRow: DefineComponent<{
  row: ITableRow
}> = defineComponent({
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
          expandCell = (
            <UTabelCell
              column={_expandColumn}
              left={_expandColumn.style.left}
              right={_expandColumn.style.right}
              key={row.uid + _expandColumn.key}
              {...tableProps.mergeCell?.(expandCtx)}
            >
              {!row.isLeaf ? (
                <UButton
                  text
                  class={cls.e('expand-toggle')}
                  type='primary'
                  size='small'
                  circle
                  onClick={e => {
                    e.stopPropagation()
                    toggleTreeRowExpand(row)
                  }}
                  style={`margin-left: ${(row.depth - 1) * 14}px`}
                >
                  <UIcon>
                    <ArrowRight />
                  </UIcon>
                </UButton>
              ) : (
                <i
                  class={cls.e('expand-space')}
                  style={`margin-left: ${(row.depth - 1) * 14}px`}
                ></i>
              )}
              {getColumnSlotsNode(expandCtx)}
            </UTabelCell>
          )
        }
      }

      return (
        <tr
          class={[
            cls.e('row'),
            bem.is('expanded', row.expanded),
            bem.is('checked', row.checked)
          ]}
          onClick={e => handleRowClick(row, e)}
          ref={measureElement as VNodeRef}
          key={row.uid}
        >
          {expandCell}

          {columns.value.map(column => {
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
                onClick={e => handleCellClick(row, column, e)}
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

export default TableRow
