import { last, o, safeRun } from '@cat-kit/core'
import { computed, nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { TableRow, BatchEditEmits, BatchEditProps } from '../../types'
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
}

export interface EditReturned {
  state: BatchEditStates
  insertIndexes: ShallowRef<number[]>
  handleSave: () => Promise<void>
  handleClose: () => void
  handleCreate: () => Promise<void>
  handleEdit: (row: TableRow) => void
  handleCopy: (row: TableRow) => Promise<void>
  handleDelete: (row: TableRow) => Promise<void>
  handleInsertToNext: (row: TableRow) => Promise<void>
  handleInsertToPrev: (row: TableRow) => Promise<void>
  handleInsertChild: (row: TableRow) => Promise<void>
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
  const { props, emit, formRef } = options

  /** 组件状态 */
  const state = shallowReactive<BatchEditStates>({
    depth: undefined,
    visible: false,
    type: 'create',
    loading: false
  })

  const insertIndexes = shallowRef<number[]>([])

  function snapshotModelData() {
    return snapshotData(props.model)
  }

  function setFormData(formData?: Record<string, any>) {
    if (!props.model) return
    replaceModelData(props.model, snapshotData(formData))
  }

  const isQuickMode = () => props.mode === 'quick'

  async function runBeforeCreate(data: Record<string, any>) {
    await props.beforeCreate?.(data, state.parentRow?.data)
  }

  watch(
    () => state.row,
    (row) => {
      if (row) {
        state.type = 'update'
        state.visible = true
        // 所有模式下都回填 model，保证表单内条件字段（依赖 model）能响应当前编辑行
        setFormData(row.data)
      } else {
        state.visible = false
      }
    },
    { flush: 'sync' }
  )

  /**
   * quick + update：model 实时写回 row.data，让表格显示同步更新。
   * normal 模式不写回，需等待保存。
   *
   * 监听源仅限 props.model（deep 遍历仅作用于 model，不触及 row 树）；
   * mode/type/row 在回调中读取但不作为依赖，避免行切换等场景误触发。
   */
  watch(
    () => props.model,
    (model) => {
      const { row, type } = state
      if (props.mode !== 'quick' || type !== 'update' || !row || !model) return
      const data = row.data
      Object.keys(model).forEach((key) => {
        const next = o(model).get(key)
        if (o(data).get(key) !== next) {
          o(data).set(key, next)
        }
      })
    },
    { deep: true }
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
    return snapshotModelData()
  }

  async function runCreate(cb: () => void, initialData?: Record<string, any>) {
    state.parentRow = undefined
    if (state.row) {
      state.row.isCurrent = false
    }
    state.row = undefined
    state.type = 'create'
    cb()

    await nextTick()

    setFormData(initialData)

    if (isQuickMode() && props.model) {
      await runBeforeCreate(props.model)
    }

    state.visible = true
  }

  /**
   * 点击新增按钮
   */
  async function handleCreate() {
    const { data } = props
    await runCreate(() => {
      state.depth = 1
      insertIndexes.value = [data?.length ?? 0]
    })
  }

  async function handleInsertToPrev(row: TableRow) {
    await runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes]
    })
  }

  async function handleInsertToNext(row: TableRow) {
    await runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
    })
  }

  async function handleInsertChild(row: TableRow) {
    await runCreate(() => {
      state.parentRow = row
      state.depth = row.depth + 1
      row.expanded = true

      insertIndexes.value = [...row.indexes, row.children?.length ?? 0]
    })
  }

  /** 编辑指定行（等同于点击行） */
  function handleEdit(row: TableRow) {
    state.type = 'update'
    state.row = row
    state.depth = row.depth
  }

  /** 复制指定行：在其下方以 create 模式打开表单，并预填副本数据 */
  async function handleCopy(row: TableRow) {
    await runCreate(() => {
      state.depth = row.depth
      insertIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
    }, row.data)
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

    if (isQuickMode() && state.type === 'update') return

    formRef.value?.clearValidate()
    const valid = await formRef.value?.validate()

    if (!valid) return

    // quick + create：仅校验 + insert
    if (isQuickMode() && state.type === 'create') {
      insert(getInsertData())
      return
    }

    let item = getInsertData()

    // normal + create：beforeCreate → saveMethod → insert
    if (state.type === 'create') {
      await runBeforeCreate(item)
      if (saveMethod) {
        const result = await saveMethod(item, state.type, state.parentRow?.data)
        if (result) {
          item = result
        }
      }
      insert(item)
      return
    }

    // normal + update
    if (saveMethod) {
      const result = await saveMethod(item, state.type, state.parentRow?.data)
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
