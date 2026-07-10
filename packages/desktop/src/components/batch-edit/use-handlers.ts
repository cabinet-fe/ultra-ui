import { last, o } from '@cat-kit/core'
import { computed, nextTick, type ShallowRef } from 'vue'

import type {
  TableRow,
  BatchEditEmits,
  BatchEditProps,
  BatchEditStates,
  FormExposed
} from '../../types'

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
  state: BatchEditStates
  formRef: ShallowRef<FormExposed | null>
  resetState: () => void
}

export interface EditReturned {
  handleSave: () => Promise<void>
  handleClose: () => void
  handleCreate: () => void
  handleDelete: (row: TableRow) => Promise<void>
  handleInsertToNext: (row: TableRow) => void
  handleInsertToPrev: (row: TableRow) => void
  handleInsertChild: (row: TableRow) => void
}

export function useHandlers(options: Options): EditReturned {
  const { props, emit, state, resetState, formRef } = options

  const childrenKey = computed(() => {
    return typeof props.tree === 'string' ? props.tree : 'children'
  })

  function getInsertData(): Record<string, any> {
    return o(props.model ?? {}).copy()
  }

  /**
   * 插入数据
   * @param item 数据
   */
  function insert(item: Record<string, any>) {
    const data = [...(props.data ?? [])]

    const parent = visitDataByIndexPath(data ?? [], state.indexPath.slice(0, -1), childrenKey.value)

    if (parent) {
      const children = parent[childrenKey.value]
      if (!children) {
        parent[childrenKey.value] = [item]
      } else {
        children.splice(last(state.indexPath), 0, item)
      }
    } else {
      data.splice(last(state.indexPath), 0, item)
    }

    emit('update:data', data)

    return item
  }

  /**
   * 点击新增按钮
   */
  function handleCreate() {
    const { data } = props

    resetState()

    nextTick(() => {
      state.formActionType = 'create'
      state.formVisible = true
      state.depth = 1
      state.indexPath = [data?.length ?? 0]
      emit('create')
    })
  }

  function handleInsertToPrev(row: TableRow) {
    resetState()
    state.formActionType = 'create'
    state.formVisible = true
    state.parentRow = row.parent
    state.depth = row.depth
    state.indexPath = [...row.indexes]
    emit('create-prev', row)
  }

  function handleInsertToNext(row: TableRow) {
    resetState()
    state.formActionType = 'create'
    state.formVisible = true
    state.parentRow = row.parent
    state.depth = row.depth
    state.indexPath = [...row.indexes.slice(0, -1), row.index + 1]
    emit('create-next', row)
  }

  function handleInsertChild(row: TableRow) {
    resetState()
    state.formActionType = 'createChild'
    state.formVisible = true
    state.parentRow = row
    state.depth = row.depth + 1
    row.expanded = true
    state.indexPath = [...row.indexes, row.children?.length ?? 0]
    emit('create-child', row)
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
    const valid = await formRef.value?.validate()
    if (!model || !valid) return

    let item = getInsertData()

    // 新增
    if (state.formActionType === 'create' || state.formActionType === 'createChild') {
      await props.beforeCreate?.(item, state.parentRow?.data)
      if (saveMethod) {
        const result = await saveMethod(item, state.formActionType, state.parentRow?.data)
        if (result) {
          item = result
        }
      }
      insert(item)

      // 推进插入点，便于连续新增；并重置表单到初始默认值
      const next = last(state.indexPath) + 1
      state.indexPath = [...state.indexPath.slice(0, -1), next]
      formRef.value?.reset()
      return
    }

    // 普通模式下的编辑
    if (saveMethod) {
      const result = await saveMethod(item, state.formActionType, state.parentRow?.data)
      if (result) {
        item = result
      }
    }

    const { row } = state
    row &&
      Object.keys(item).forEach((key) => {
        o(row.data).set(key, o(item).get(key))
      })
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
      resetState()
    }

    emit('update:data', data)
  })

  function handleClose() {
    resetState()
  }

  return {
    handleDelete,
    handleInsertChild,
    handleInsertToNext,
    handleInsertToPrev,
    handleCreate,
    handleClose,
    handleSave
  }
}
