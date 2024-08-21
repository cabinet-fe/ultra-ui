import { defineComponent, type PropType, type VNodeRef } from 'vue'
import type { TableRow } from './use-rows'
import { inject } from 'vue'
import { TableDIKey } from './di'
import { UNodeRender } from '../node-render'
import UTabelCell from './table-cell.vue'
import { bem } from '@ui/utils'
import { ArrowRight } from 'icon-ultra'
import { UButton } from '../button'
import { UIcon } from '../icon'
import type { JSX } from 'vue/jsx-runtime'

export default defineComponent({
  name: 'TableRow',

  props: {
    row: {
      type: Object as PropType<TableRow>,
      required: true
    },
    dataIndex: {
      type: Number as PropType<number>,
      required: true
    }
  },

  setup(props) {
    const { row, dataIndex } = props

    const {
      cls,
      columnConfig,
      getColumnSlotsNode,
      toggleTreeRowExpand,
      getCellCtx,
      handleRowClick,
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
              key={_expandColumn.key + _expandColumn.keySuffix}
              {...tableProps.mergeCell?.(expandCtx)}
            >
              {!row.isLeaf ? (
                <UButton
                  text
                  class={cls.e('expand-toggle')}
                  type="primary"
                  size="small"
                  circle
                  onClick={e => {
                    e.stopPropagation();
                    toggleTreeRowExpand(row);
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
              <UNodeRender content={getColumnSlotsNode(expandCtx)} />
            </UTabelCell>
          )
        }
      }

      return (
        <tr
          class={[cls.e('row'), bem.is('expanded', row.expanded)]}
          onClick={() => handleRowClick(row)}
          ref={measureElement as VNodeRef}
          data-index={dataIndex}
        >
          {expandCell}

          {columns.value.map(column => {
            const cellCtx = getCellCtx(row, column)
            const cellSpan = tableProps.mergeCell?.(cellCtx)
            if (cellSpan && (!cellSpan.colspan || !cellSpan.rowspan)) {
              return null
            }

            return (
              <UTabelCell
                column={column}
                left={column.style.left}
                right={column.style.right}
                key={column.key + column.keySuffix}
                {...cellSpan}
              >
                <UNodeRender content={getColumnSlotsNode(cellCtx)} />
              </UTabelCell>
            )
          })}
        </tr>
      )
    }
  }
})
