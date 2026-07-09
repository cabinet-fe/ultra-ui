import { o } from '@cat-kit/core'
import { nextTick, shallowReactive, watch, type ShallowRef } from 'vue'

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

  function resetState() {
    // 销毁表单前先重置，避免下次 v-if 重挂载时 Form 拍到脏 model
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
      formRef.value?.reset()

      if (row) {
        /** 延迟设置 model，防止表单初始状态丢失 */
        nextTick(() => {
          if (props.model) {
            o(props.model).deepExtend(row.data)
          }
        })
        state.formActionType = props.readonly ? 'view' : 'update'
        state.formVisible = true
        state.depth = row.depth
        state.indexPath = [...row.indexes]

        return
      }

      resetState()
    }
  )

  return { state, resetState }
}
