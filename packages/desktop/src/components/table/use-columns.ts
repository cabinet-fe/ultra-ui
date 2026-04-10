import { Forest, dfs, last } from '@cat-kit/core'
import { ArrowRight } from '@ultra-ui/icons/normal'
import { type BEM } from '@ultra-ui/utils'
import { computed, createVNode, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue'

import type { TableColumn, TableProps } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'
import { ColumnNode } from './node/col'

/**
 * 定义表格列
 * @param columns 表格列
 */
export function defineTableColumns(
  columns: TableColumn[],
  commonProps?: Partial<Pick<TableColumn, 'align' | 'minWidth'>>
): TableColumn[] {
  columns.forEach((col) => {
    dfs(col, (node) => {
      for (const key in commonProps) {
        if (node[key] !== undefined) continue
        node[key] = commonProps[key]
      }
    })
  })
  return columns
}

export interface ColumnConfig {
  /** 表头 */
  headers: ComputedRef<ColumnNode[][]>

  /**
   *  body列, 在body中使用
   */
  columns: ShallowRef<ColumnNode[]>

  /** 所有叶子列 */
  leafColumns: ShallowRef<ColumnNode[]>

  /** 第一列 */
  expandColumn: ShallowRef<ColumnNode | undefined>
}

interface Options {
  props: TableProps
  cls: BEM<'table'>
  /** 创建复选框 */
  createCheckColumn: () => TableColumn
  createSelectColumn: () => TableColumn
  toggleAllTreeRowExpand: () => void
}

export function useColumns(options: Options): ColumnConfig {
  const { props, createCheckColumn, createSelectColumn, toggleAllTreeRowExpand, cls } = options

  /** 前置列 */
  const preColumns = computed<TableColumn[]>(() => {
    const { selectable, checkable, showIndex } = props

    const columns: TableColumn[] = []

    if (selectable) {
      columns.push(createSelectColumn())
    } else if (checkable) {
      columns.push(createCheckColumn())
    }
    if (showIndex) {
      columns.push({
        key: '__index__',
        name: '#',
        resizable: false,
        width: 60,
        minWidth: 60,
        align: 'center',
        fixed: 'left',
        render({ row }) {
          return row.index + 1
        }
      })
    }

    return columns
  })

  const columnForest = shallowRef<Forest<TableColumn, any>>()

  const renderExpandAll = () =>
    createVNode(
      UButton,
      {
        text: true,
        title: '展开或收起全部',
        class: cls.e('expand-all'),
        type: 'primary',
        size: 'small',
        circle: true,
        onClick: (e) => {
          e.stopPropagation()
          toggleAllTreeRowExpand()
        }
      },
      () => [createVNode(UIcon, undefined, () => [createVNode(ArrowRight)])]
    )

  watch(
    [preColumns, () => props.columns, () => props.tree, () => props.expandable],
    ([preColumns, columns, tree, expandable]) => {
      /** 固定到左侧的列 */
      const fixedOnLeft: TableColumn[] = [...preColumns]
      /** 未固定的列 */
      const unfixed: TableColumn[] = []
      /** 固定到右侧的列 */
      const fixedOnRight: TableColumn[] = []

      columns?.forEach((column) => {
        if (!column.fixed || column.children) {
          column.fixed = undefined
          return unfixed.push(column)
        }
        if (column.fixed === 'left') {
          fixedOnLeft.push(column)
        } else {
          fixedOnRight.push(column)
        }
      })

      if (last(fixedOnLeft)) {
        last(fixedOnLeft)!.isLastFixed = true
      }
      if (fixedOnRight[0]) {
        fixedOnRight[0].isFirstFixed = true
      }

      const sortedColumns = [...fixedOnLeft, ...unfixed, ...fixedOnRight]
      // 操作时避免改变原数据
      const firstColumn = { ...sortedColumns[0] } as TableColumn
      sortedColumns[0] = firstColumn

      // 树形表格需要给第一列添加展开按钮
      // 因此要重新设置第一列的宽度和对齐方式
      if ((!!tree || expandable) && firstColumn) {
        firstColumn.align = 'left'
        firstColumn.width = firstColumn.width ? firstColumn.width + 60 : undefined

        const oldNameRender = firstColumn.nameRender

        firstColumn.nameRender = oldNameRender
          ? (ctx) => {
              const oldNodes = oldNameRender!(ctx)
              return [renderExpandAll(), ...(Array.isArray(oldNodes) ? oldNodes : [oldNodes])]
            }
          : () => {
              return [renderExpandAll(), firstColumn.name]
            }
      }

      const result = new Forest<TableColumn, any>({
        data: sortedColumns,
        createNode(data, index, depth, _f, parent) {
          return new ColumnNode(data, index, depth, parent)
        }
      })

      columnForest.value = result
    },
    { immediate: true }
  )

  const headers = computed(() => {
    const headers: ColumnNode[][] = []
    const forest = columnForest.value
    if (!forest) return headers

    // Forest.bfs 对每个根单独 BFS，按 depth 拼行会把后续根节点错放到深层，且根节点无 parent，
    // 回溯 leafs 时会读到 undefined。这里从所有根一次性层序遍历，与多列表头布局一致。
    const queue: ColumnNode[] = [...forest.roots]
    while (queue.length > 0) {
      const size = queue.length
      const layer: ColumnNode[] = []
      for (let i = 0; i < size; i++) {
        const node = queue.shift()!
        layer.push(node)
        const ch = node.children
        if (ch?.length) {
          for (const c of ch) {
            queue.push(c)
          }
        }
      }
      headers.push(layer)
    }

    // 从叶子节点开始回溯计算每个节点的累计叶子节点数量，叶子节点数量代表表头的宽度
    for (let i = headers.length - 1; i > 0; i--) {
      const header = headers[i]!

      header.forEach((node) => {
        const parent = node.parent
        if (!parent) return
        if (parent.leafs !== undefined) return
        parent.leafs = parent.children!.reduce((sum, node) => {
          return sum + (node.leafs ?? 1)
        }, 0)
      })
    }

    return headers
  })

  /** 除展开按钮之外的列 */
  const columns = shallowRef<ColumnNode[]>([])

  /** 所有叶子节点 */
  const leafColumns = shallowRef<ColumnNode[]>([])

  const expandColumn = shallowRef<ColumnNode>()

  // 监听列的变化
  watch(
    [columnForest, () => props.tree, () => props.expandable],
    ([forest, tree, expandable]) => {
      const _columns: ColumnNode[] = []

      forest?.dfs((node) => {
        if (node.isLeaf) {
          _columns.push(node)
        }
      })

      leafColumns.value = _columns

      if (tree || expandable) {
        expandColumn.value = _columns[0]
        columns.value = _columns.slice(1)
      } else {
        columns.value = _columns
        expandColumn.value = undefined
      }
    },
    { immediate: true }
  )

  return {
    /** 第一列 */
    expandColumn,
    /** 所有列 */
    leafColumns,
    /** 列 */
    columns,
    /** 表格头的分层展示 */
    headers
  }
}
