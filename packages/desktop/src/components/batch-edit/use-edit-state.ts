import { copy, o } from '@cat-kit/core'
import { nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { BatchEditProps, BatchEditStates, FormExposed, TableRow } from '../../types'

interface Options {
  props: BatchEditProps
  formRef: ShallowRef<FormExposed | null>
}

export function useEditState(options: Options) {
  const { props, formRef } = options

  const defaultState: BatchEditStates = {
    depth: -1,
    formVisible: false,
    formActionType: 'create',
    loading: false,
    indexPath: []
  }

  const state = shallowReactive({ ...defaultState })

  /** 是否正在以编程方式重置/回显表单，此期间禁止 quick-edit 回写行数据 */
  const syncing = shallowRef(false)

  /**
   * model 初始快照。
   * 面板模式由常驻挂载的 UForm 自行维护快照；dialog 模式表单随弹框卸载，
   * UForm 快照会在每次打开时按已回显的 model 重拍，故这里单独保留一份供恢复
   */
  const initialModel = shallowRef<Record<string, any>>()

  watch(
    () => props.model,
    (model) => {
      initialModel.value = props.formMode === 'dialog' && model ? copy(model) : undefined
    },
    { immediate: true }
  )

  /** 重置表单数据到 model 初始快照 */
  function resetModel() {
    if (props.formMode !== 'dialog') {
      formRef.value?.reset()
      return
    }

    formRef.value?.clearValidate()
    if (!props.model || !initialModel.value) return
    for (const key of Object.keys(initialModel.value)) {
      o(props.model).set(key, copy(initialModel.value[key]))
    }
  }

  function resetState() {
    resetModel()

    Object.keys(state).forEach((key) => {
      delete state[key]
    })

    Object.assign(state, defaultState)
  }

  /**
   * 开始编辑/查看一行：先重置回 model 初始快照，再回显行数据。
   * 同一 tick 内的连续写入会被表单字段 watcher 合并，
   * 重置产生的默认值不会触发 field:update 回写行数据
   */
  function startEdit(row: TableRow) {
    syncing.value = true

    resetModel()

    if (props.model) {
      o(props.model).deepExtend(row.data)
    }

    state.row = row
    state.formActionType = props.readonly ? 'view' : 'update'
    state.formVisible = true
    state.depth = row.depth
    state.indexPath = [...row.indexes]

    nextTick(() => {
      syncing.value = false
    })
  }

  return { state, resetState, startEdit, syncing }
}
