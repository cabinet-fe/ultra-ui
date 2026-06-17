import { last, o, safeRun } from '@cat-kit/core'
import { computed, nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { TableRow, BatchEditEmits, BatchEditProps, TableExposed } from '../../types'
import type { FormExposed } from '../../types/form'

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
  formRef: ShallowRef<FormExposed | undefined>
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
  handleEdit: (row: TableRow) => void
  handleCopy: (row: TableRow) => void
  handleDelete: (row: TableRow) => Promise<void>
  handleInsertToNext: (row: TableRow) => void
  handleInsertToPrev: (row: TableRow) => void
  handleInsertChild: (row: TableRow) => void
}

function snapshotData(data?: Record<string, any>) {
  return safeRun(() => JSON.parse(JSON.stringify(data ?? {})), {})
}

function replaceModelData(model: Record<string, any>, data: Record<string, any>) {
  for (const key of Object.keys(model)) {
    delete model[key]
  }
  Object.assign(model, data)
}

export function useEdit(options: Options): EditReturned {
  const { props, emit, tableRef, formRef } = options

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

  /**
   * 「打开行 / 切换 type」时记录的基线快照
   * @description
   * 用于 changeCb 内部比对 — 若新值与基线相等（深比较）视为无改动，避免某些组件在 mount
   * 阶段把规范化后的值再写回模型时被误判为「用户已修改」
   */
  let baselineSnapshot: Record<string, any> | undefined
  let emptySnapshot: Record<string, any> | undefined

  function snapshotModelData() {
    return snapshotData(props.model)
  }

  function resetFormData(data?: Record<string, any>) {
    if (!props.model) return
    replaceModelData(props.model, snapshotData(data ?? emptySnapshot))
    formRef.value?.clearValidate()
  }

  function setFormData(formData: Record<string, any>) {
    if (!props.model) return
    replaceModelData(props.model, snapshotData(formData))
  }

  watch(
    () => props.model,
    (model) => {
      emptySnapshot = snapshotData(model)
    },
    { immediate: true }
  )

  watch(
    () => state.row,
    (row) => {
      resetFormData()
      if (row) {
        state.type = 'update'
        state.visible = true
        setFormData(row.data)
      } else {
        state.visible = false
      }
      baselineSnapshot = snapshotModelData()
      state.dataUpdated = false
    },
    // sync 保证 setData 完成后立刻取快照，避免 mount 期间组件回写值时丢基线
    { flush: 'sync' }
  )

  watch(
    () => props.model,
    () => {
      if (!baselineSnapshot || !state.visible) return
      state.dataUpdated = !isSameValue(baselineSnapshot, snapshotModelData())
    },
    { deep: true }
  )

  function isSameValue(a: any, b: any) {
    if (a === b) return true
    if (a == null && b == null) return true
    if (typeof a !== typeof b) return false
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch {
        return false
      }
    }
    return false
  }

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
    return snapshotModelData()
  }

  async function runCreate(cb: () => void) {
    state.parentRow = undefined
    if (state.row) {
      state.row.isCurrent = false
    }
    state.row = undefined
    state.type = 'create'
    resetFormData()
    cb()

    let item: Record<string, any> | undefined = undefined

    await nextTick()

    state.visible = true
    baselineSnapshot = snapshotModelData()
    state.dataUpdated = false

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

  /** 编辑指定行（等同于点击行） */
  function handleEdit(row: TableRow) {
    state.row = row
    state.depth = row.depth
  }

  /** 复制指定行：在其下方以 create 模式打开表单，并预填副本数据 */
  function handleCopy(row: TableRow) {
    runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
      setFormData(row.data)
      baselineSnapshot = snapshotModelData()
      state.dataUpdated = false
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

    formRef.value?.clearValidate()
    const valid = await formRef.value?.validate()

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

      resetFormData()
      return
    }
    // 更新
    if (state.type === 'update') {
      const { row } = state
      row &&
        Object.keys(item).forEach((key) => {
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
    resetFormData()
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
    handleEdit,
    handleCopy,
    handleClose,
    handleSave
  }
}
