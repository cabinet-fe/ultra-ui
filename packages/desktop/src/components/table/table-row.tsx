import { ArrowRight } from '@veltra/icons/normal'
import { defineComponent, type DefineComponent } from 'vue'
import { inject, onUnmounted } from 'vue'
import type { JSX } from 'vue/jsx-runtime'

import type { TableRow as ITableRow } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'
import { TableDIKey } from './di'
import UTabelCell from './table-cell.vue'

/**
 * A3：行修饰类组合静态查找表。
 *
 * 位模式：bit2 = isCurrent, bit1 = checked, bit0 = expanded。
 * 与 `bem.is('...')` 对于 `'current' | 'checked' | 'expanded'` 的输出完全等价，
 * 直接从 index 读字符串，消除每行渲染期间的字符串拼接和 3 次 bem.is 调用。
 *
 * 放在模块顶层使所有 TableRow 实例共享一份引用（不会随 setup 重建）。
 */
const ROW_MOD_CLASS: readonly string[] = [
  '',
  'is-expanded',
  'is-checked',
  'is-checked is-expanded',
  'is-current',
  'is-current is-expanded',
  'is-current is-checked',
  'is-current is-checked is-expanded'
] as const

function rowModCls(row: ITableRow): string {
  const i = (row.isCurrent ? 4 : 0) | (row.checked ? 2 : 0) | (row.expanded ? 1 : 0)
  return ROW_MOD_CLASS[i]!
}

export const UTableRow: DefineComponent<{ row: ITableRow; index: number }> = defineComponent({
  name: 'TableRow',

  props: {
    row: { type: Object as () => ITableRow, required: true },
    index: { type: Number, required: true }
  },

  setup(props) {
    const {
      cls,
      columnConfig,
      getColumnSlotsNode,
      toggleTreeRowExpand,
      getCellCtx,
      handleRowClick,
      handleCellClick,
      tableProps,
      measureElement,
      getCellClass
    } = inject(TableDIKey)!

    // A1：把 cls.e('row') / cls.e('expand-toggle') 等静态字符串提升到 setup 一次性计算，
    // 避免每次 render 重新走 `cls.e` 拼接。
    const rowBaseCls = cls.e('row')
    const expandToggleCls = cls.e('expand-toggle')
    const expandSpaceCls = cls.e('expand-space')

    // A2：measureRef 按 index 缓存闭包。
    // 行虚拟化下，同一 TableRow 实例的 props.index 大多稳定，但在虚拟化重排或展开行切换时
    // 仍会发生变化；把 (index) → refFn 缓存起来，既保证引用稳定（利于 Vue 的 ref diff），
    // 又避免在未来可能的"同实例跨 index 复用"情形下重复分配闭包。
    const measureRefCache = new Map<number, (el: unknown) => void>()
    const getMeasureRef = (index: number): ((el: unknown) => void) => {
      let ref = measureRefCache.get(index)
      if (ref === undefined) {
        ref = (el: unknown) => {
          measureElement(index, el as Element | null)
        }
        measureRefCache.set(index, ref)
      }
      return ref
    }
    onUnmounted(() => {
      measureRefCache.clear()
    })

    const { columns, expandColumn } = columnConfig

    return () => {
      const { row } = props
      const _expandColumn = expandColumn.value

      let expandCell: JSX.Element | null = null
      if (_expandColumn) {
        const expandCtx = getCellCtx(row, _expandColumn)
        const cellSpan = tableProps.mergeCell?.(expandCtx)

        if (!cellSpan || (cellSpan.colspan && cellSpan.rowspan)) {
          const marginLeft = tableProps.tree ? (row.depth - 1) * 14 : 0
          expandCell = (
            <UTabelCell
              cellClass={getCellClass(_expandColumn)}
              left={_expandColumn.style.left}
              right={_expandColumn.style.right}
              key={row.uid + _expandColumn.key}
              {...tableProps.mergeCell?.(expandCtx)}
            >
              {!row.isLeaf || (tableProps.expandable && !row.isExpandRow) ? (
                <UButton
                  text
                  class={expandToggleCls}
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
                <i class={expandSpaceCls} style={`margin-left: ${marginLeft}px`}></i>
              )}

              {getColumnSlotsNode(expandCtx)}
            </UTabelCell>
          )
        }
      }

      // A3：行 class 由 base + 3-bit 组合查找产出，避免 Vue 的 class 数组归一化开销。
      const mod = rowModCls(row)
      const rowCls = mod ? rowBaseCls + ' ' + mod : rowBaseCls

      return (
        <tr
          class={rowCls}
          onClick={(e) => handleRowClick(row, e)}
          ref={getMeasureRef(props.index)}
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
                cellClass={getCellClass(column)}
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
  props: {
    row: { type: Object as () => ITableRow, required: true },
    index: { type: Number, required: true }
  },
  setup(props) {
    const { getExpandRowSlotsNode, cls, measureElement, columnConfig } = inject(TableDIKey)!
    const { leafColumns } = columnConfig

    const rowBaseCls = cls.e('row')
    const cellCls = cls.e('cell')

    const measureRef = (el: unknown) => {
      measureElement(props.index, el as Element | null)
    }

    return () => {
      const { row } = props
      const node = getExpandRowSlotsNode({
        row,
        index: row.index,
        columns: leafColumns.value,
        rowData: row.data
      })
      return (
        <tr class={rowBaseCls} ref={measureRef}>
          <td colspan={leafColumns.value.length} class={cellCls}>
            {node}
          </td>
        </tr>
      )
    }
  }
})
