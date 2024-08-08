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

  const quickEdit = shallowRef(false)

  watch(quickEdit, quickEdit => {
    if (quickEdit) {
      props.model?.onChange((field, value) => {
        state.row && setChainValue(state.row.data, field, value)
      })
    } else {
      props.model?.offChange()
    }
  })

  let insertIndexes: number[] = []

  const childrenKey = computed(() => {
    return typeof props.tree === 'string' ? props.tree : 'children'
  })

  /** 打开表单 */
  function openForm(type: States['type']) {
    state.type = type
    state.visible = true
  }

  /**
   * 关闭弹框
   */
  function closeForm() {
    insertIndexes = []
    props.model?.resetData()
    state.loading = false
    state.row = undefined
    state.parentRow = undefined
    state.visible = false
  }

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
      insertIndexes.slice(0, -1),
      childrenKey.value
    )

    if (parent) {
      const children = parent[childrenKey.value]
      if (!children) {
        parent[childrenKey.value] = [item]
      } else {
        children.splice(last(insertIndexes), 0, item)
      }
    } else {
      data.splice(last(insertIndexes), 0, item)
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

  function runCreate(cb?: () => any) {
    closeForm()
    tableRef.value?.clearCurrentRow()
    nextTick(() => {
      openForm('create')
      cb?.()
    })
  }

  /**
   * 点击新增按钮
   */
  function handleCreate() {
    const { data } = props
    runCreate()
    insertIndexes = [data?.length ?? 0]
    if (quickEdit.value) {
      const item = insert(getInsertData())
      nextTick(() => {
        tableRef.value?.setCurrentRow(item)
      })
    }
  }

  function handleCurrentRowChange(row?: TableRow) {
    closeForm()
    if (!row) return
    state.row = row
    props.model?.setData(row.data)
    nextTick(() => {
      openForm('update')
    })
  }

  function handleInsertToPrev(row: TableRow) {
    runCreate()
    insertIndexes = [...row.indexes]
  }
  function handleInsertToNext(row: TableRow) {
    runCreate()
    insertIndexes = [...row.indexes.slice(0, -1), row.index + 1]
  }

  function handleInsertChild(row: TableRow) {
    runCreate(() => {
      state.parentRow = row
    })
    insertIndexes = [...row.indexes, row.children?.length ?? 0]
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
      closeForm()
      tableRef.value?.clearCurrentRow()
    }

    emit('update:data', data)
  })

  function handleClose() {
    closeForm()
    tableRef.value?.clearCurrentRow()
  }

  return {
    state,
    quickEdit,
    handleDelete,
    handleInsertChild,
    handleInsertToNext,
    handleInsertToPrev,
    handleCreate,
    handleClose,
    handleSave,
    handleCurrentRowChange
  }
}
