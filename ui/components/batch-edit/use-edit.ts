import {
  computed,
  isReactive,
  nextTick,
  shallowReactive,
  shallowRef,
  watch,
  type ShallowRef
} from 'vue'
import type { TableRow } from '../table'
import type { BatchEditEmits, BatchEditProps, TableExposed } from '@ui/types'
import { Forest, getChainValue, last, safeRun, setChainValue } from 'cat-kit/fe'

interface Options {
  props: BatchEditProps
  emit: BatchEditEmits
  tableRef: ShallowRef<TableExposed | undefined>
}

interface States {
  visible: boolean
  type: 'create' | 'update'
  loading: boolean
  row?: TableRow
  /** 父级，只在添加子级时会有值 */
  parentRow?: TableRow
}

export function useEdit(options: Options) {
  const { props, emit, tableRef } = options

  /** 组件状态 */
  const state = shallowReactive<States>({
    visible: false,
    type: 'create',
    loading: false
  })

  const insertIndexes = shallowRef<number[]>([])

  watch(
    () => state.row,
    row => {
      props.model?.resetData()
      if (row) {
        state.type = 'update'
        state.visible = true
        props.model?.setData(row.data)
      } else {
        state.visible = false
      }
    }
  )

  const quickEdit = shallowRef(props.defaultQuickEdit ?? false)

  watch(
    () => props.defaultQuickEdit,
    defaultQuickEdit => {
      if (defaultQuickEdit === undefined) return
      quickEdit.value = defaultQuickEdit
    }
  )

  watch(quickEdit, quickEdit => {
    if (quickEdit) {
      props.model?.onChange((field, value) => {
        state.row && setChainValue(state.row.data, field, value)
      })
    } else {
      props.model?.offChange()
    }
  })

  const childrenKey = computed(() => {
    return typeof props.tree === 'string' ? props.tree : 'children'
  })

  /**
   * 插入数据
   * @param item 数据
   */
  function insert(item: Record<string, any>) {
    const data = [...(props.data ?? [])]

    if (quickEdit.value) {
      if (!isReactive(item)) {
        item = shallowReactive(item)
      }
    }

    const parent = Forest.visit(
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
    return safeRun(
      () => JSON.parse(JSON.stringify(props.model?.data ?? {})),
      {}
    )
  }

  async function runCreate(cb: () => void) {
    state.row = undefined
    state.type = 'create'
    props.model?.resetData()

    cb()

    const item = insert(getInsertData())

    await nextTick()

    state.visible = true
    if (quickEdit.value) {
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
      insertIndexes.value = [data?.length ?? 0]
    })
  }

  function handleInsertToPrev(row: TableRow) {
    console.log(row)
    runCreate(() => {
      insertIndexes.value = [...row.indexes]
    })
  }

  function handleInsertToNext(row: TableRow) {
    runCreate(() => {
      insertIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
    })
  }

  function handleInsertChild(row: TableRow) {
    runCreate(() => {
      state.parentRow = row
      row.expanded = true
      insertIndexes.value = [...row.indexes, row.children?.length ?? 0]
    })
  }

  function runWithLoading<Arg extends any[]>(
    fn: (...args: Arg) => Promise<void> | void
  ) {
    return async (...args: Arg) => {
      state.loading = true
      if (state.row) {
        state.row.operating = true
      }
      try {
        await fn.apply(null, args)
      } catch (error) {
        console.log(error)
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
    // 新增
    if (state.type === 'create') {
      insert(item)
      return model?.resetData()
    }
    if (state.type === 'update') {
      const { row } = state
      row &&
        model.allKeys.forEach(key => {
          setChainValue(row.data, key, getChainValue(item, key))
        })
    }
  })

  const handleDelete = runWithLoading(async (row: TableRow) => {
    const { deleteMethod } = props

    if (deleteMethod) {
      await deleteMethod([row.data])
    }

    const data = [...(props.data ?? [])]

    const parent = Forest.visit(
      data,
      row.indexes.slice(0, -1),
      childrenKey.value
    )

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
    }

    emit('update:data', data)
  })

  function handleClose() {
    state.visible = false
    state.row = undefined
    state.parentRow = undefined
    props.model?.resetData()
    insertIndexes.value = []
  }

  return {
    state,
    insertIndexes,
    quickEdit,
    handleDelete,
    handleInsertChild,
    handleInsertToNext,
    handleInsertToPrev,
    handleCreate,
    handleClose,
    handleSave
  }
}
