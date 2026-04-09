import { last, o, safeRun } from '@cat-kit/core'
import { computed, nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { TableRow, BatchEditEmits, BatchEditProps, TableExposed } from '../../types'

/** 按索引路径在原始数据树中定位节点（等价于历史 Forest.visit 路径访问） */
function visitDataByIndexPath<T extends Record<string, unknown>>(
  roots: T[],
  indexPath: number[],
  childrenKey: string
): T | undefined {
  if (!indexPath.length) return undefined
  let currentList: T[] | undefined = roots
  let node: T | undefined
  for (let i = 0; i < indexPath.length; i++) {
    const idx = indexPath[i]!
    if (!currentList) return undefined
    node = currentList[idx]
    if (node === undefined) return undefined
    if (i < indexPath.length - 1) {
      const next = node[childrenKey]
      currentList = Array.isArray(next) ? (next as T[]) : undefined
    }
  }
  return node
}

interface Options {
  props: BatchEditProps
  emit: BatchEditEmits
  tableRef: ShallowRef<TableExposed | undefined>
}

export interface BatchEditStates {
  /** 层级 */
  depth?: number
  visible: boolean
  type: 'create' | 'update'
  loading: boolean
  row?: TableRow
  /** 父级，只在添加子级时会有值 */
  parentRow?: TableRow
  /** 数据是否已更新 */
  dataUpdated: boolean
}

export interface EditReturned {
  state: BatchEditStates
  insertIndexes: ShallowRef<number[]>
  handleSave: () => Promise<void>
  handleClose: () => void
  handleCreate: () => void
  handleDelete: (row: TableRow) => Promise<void>
  handleInsertToNext: (row: TableRow) => void
  handleInsertToPrev: (row: TableRow) => void
  handleInsertChild: (row: TableRow) => void
}

export function useEdit(options: Options): EditReturned {
  const { props, emit, tableRef } = options

  /** 组件状态 */
  const state = shallowReactive<BatchEditStates>({
    depth: undefined,
    visible: false,
    type: 'create',
    loading: false,
    dataUpdated: false
  })

  const insertIndexes = shallowRef<number[]>([])

  watch(
    () => state.visible,
    (v) => {
      if (!v) {
        state.dataUpdated = false
      }
    }
  )

  /** 是否是用户输入产生的值变更 */
  let changedByUserInput = true

  watch(
    () => state.row,
    (row) => {
      props.model?.resetData()
      if (row) {
        state.type = 'update'
        state.visible = true
        changedByUserInput = false
        props.model?.setData(row.data)
        nextTick(() => {
          changedByUserInput = true
        })
      } else {
        state.visible = false
      }
    }
  )

  const changeCb = (field: string, val: any) => {
    // 检测到为用户变更时，为数据添加一个已更改状态从而显示修改按钮
    if (changedByUserInput) {
      state.dataUpdated = true
    }
  }

  watch(
    () => props.model,
    (model, oldModel) => {
      if (oldModel) {
        oldModel.offChange(changeCb)
      }
      if (model) {
        model.onChange(changeCb)
      }
    },
    { immediate: true }
  )

  const childrenKey = computed(() => {
    return typeof props.tree === 'string' ? props.tree : 'children'
  })

  /**
   * 插入数据
   * @param item 数据
   */
  function insert(item: Record<string, any>) {
    const data = [...(props.data ?? [])]

    const parent = visitDataByIndexPath(
      data ?? [],
      insertIndexes.value.slice(0, -1),
      childrenKey.value
    )

    if (parent) {
      const children = parent[childrenKey.value]
      if (!children) {
        parent[childrenKey.value] = [item]
      } else {
        children.splice(last(insertIndexes.value), 0, item)
      }
    } else {
      data.splice(last(insertIndexes.value), 0, item)
    }

    emit('update:data', data)

    return item
  }

  function getInsertData(): Record<string, any> {
    return safeRun(() => JSON.parse(JSON.stringify(props.model?.data ?? {})), {})
  }

  async function runCreate(cb: () => void) {
    state.parentRow = undefined
    if (state.row) {
      state.row.isCurrent = false
    }
    state.row = undefined
    state.type = 'create'
    props.model?.resetData()
    cb()

    let item: Record<string, any> | undefined = undefined

    await nextTick()

    state.visible = true

    if (item) {
      const row = tableRef.value?.getRowByData(item)
      if (row) {
        state.row = row
      }
    }
  }

  /**
   * 点击新增按钮
   */
  function handleCreate() {
    const { data } = props
    runCreate(() => {
      state.depth = 1
      insertIndexes.value = [data?.length ?? 0]
    })
  }

  function handleInsertToPrev(row: TableRow) {
    runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes]
    })
  }

  function handleInsertToNext(row: TableRow) {
    runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
    })
  }

  function handleInsertChild(row: TableRow) {
    runCreate(() => {
      state.parentRow = row
      state.depth = row.depth + 1
      row.expanded = true

      insertIndexes.value = [...row.indexes, row.children?.length ?? 0]
    })
  }

  function runWithLoading<Arg extends any[]>(fn: (...args: Arg) => Promise<void> | void) {
    return async (...args: Arg) => {
      state.loading = true
      if (state.row) {
        state.row.operating = true
      }
      try {
        await fn.apply(null, args)
      } catch (error) {
        console.error(error)
      }
      state.loading = false
      if (state.row) {
        state.row.operating = false
      }
    }
  }

  /** 保存 */
  const handleSave = runWithLoading(async () => {
    const { model, saveMethod } = props

    if (!model) return

    model.clearValidate()
    const valid = await model.validate()

    if (!valid) return

    let item = getInsertData()
    if (saveMethod) {
      const result = await saveMethod(item, state.type, state.parentRow)
      if (result) {
        item = result
      }
    }

    state.dataUpdated = false

    // 新增
    if (state.type === 'create') {
      insert(item)

      return model?.resetData()
    }
    // 更新
    if (state.type === 'update') {
      const { row } = state
      row &&
        model.allKeys.forEach((key) => {
          o(row.data).set(key, o(item).get(key))
        })
    }
  })

  const handleDelete = runWithLoading(async (row: TableRow) => {
    const { deleteMethod } = props

    if (deleteMethod) {
      await deleteMethod([row.data])
    }

    const data = [...(props.data ?? [])]

    const parent = visitDataByIndexPath(data, row.indexes.slice(0, -1), childrenKey.value)

    if (parent) {
      const children = parent[childrenKey.value]
      if (children) {
        children.splice(row.index, 1)
      } else {
        console.error('行路径不正确')
      }
    } else {
      data.splice(row.index, 1)
    }

    if (state.row === row) {
      state.row = undefined
      state.depth = undefined
    }

    emit('update:data', data)
  })

  function handleClose() {
    state.visible = false
    if (state.row) {
      state.row.isCurrent = false
    }
    state.row = undefined
    state.parentRow = undefined
    state.depth = undefined
    props.model?.resetData()
    insertIndexes.value = []
  }

  return {
    state,
    insertIndexes,
    handleDelete,
    handleInsertChild,
    handleInsertToNext,
    handleInsertToPrev,
    handleCreate,
    handleClose,
    handleSave
  }
}
