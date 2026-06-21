import { o } from '@cat-kit/core'
import { shallowReactive, watch } from 'vue'

import type { BatchEditProps, BatchEditStates } from '../../types'

interface Options {
  props: BatchEditProps
}

export function useEditState(options: Options) {
  const { props } = options

  const defaultState: BatchEditStates = {
    depth: -1,
    formVisible: false,
    formActionType: 'create',
    loading: false,
    indexPath: []
  }

  const state = shallowReactive({ ...defaultState })

  function resetState() {
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
      resetState()
      if (row) {
        if (props.model) {
          o(props.model).deepExtend(row.data)
        }
        state.formActionType = props.readonly ? 'view' : 'update'
        state.formVisible = true
        state.depth = row.depth
        state.indexPath = [...row.indexes]

        return
      }
    }
  )

  return { state, resetState }
}
