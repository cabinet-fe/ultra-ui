import { o } from '@cat-kit/core'
import { nextTick, shallowReactive, shallowRef, watch, type ShallowRef } from 'vue'

import type { BatchEditProps, BatchEditStates, FormExposed } from '../../types'

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

  function resetState() {
    // 表单常驻挂载，重置即恢复到 model 初始快照
    formRef.value?.reset()

    if (state.row) {
      state.row.isCurrent = false
    }

    Object.keys(state).forEach((key) => {
      delete state[key]
    })

    Object.assign(state, defaultState)
  }

  watch(
    () => state.row,
    (row) => {
      syncing.value = true

      // 先重置回 model 初始快照，再同步回显行数据。
      // 同一 tick 内的连续写入会被表单字段 watcher 合并，
      // 重置产生的默认值不会触发 field:change 回写行数据
      formRef.value?.reset()

      if (row) {
        if (props.model) {
          o(props.model).deepExtend(row.data)
        }
        state.formActionType = props.readonly ? 'view' : 'update'
        state.formVisible = true
        state.depth = row.depth
        state.indexPath = [...row.indexes]
      } else {
        resetState()
      }

      nextTick(() => {
        syncing.value = false
      })
    }
  )

  return { state, resetState, syncing }
}
