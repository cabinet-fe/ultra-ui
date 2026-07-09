import { shallowRef } from 'vue'

import type { BatchEditProps, BatchEditStates } from '../../types'

interface Options {
  props: BatchEditProps
  onSave: () => void
  onClose: () => void
  state: BatchEditStates
}
export function useShortcutKey(options: Options) {
  const { props, onClose, onSave, state } = options
  const focused = shallowRef(false)

  function handleFocusIn() {
    focused.value = true
  }

  function handleFocusOut(e: FocusEvent) {
    const root = e.currentTarget as HTMLElement
    if (!root.contains(e.relatedTarget as Node | null)) {
      focused.value = false
    }
  }

  function runEscape(e: KeyboardEvent) {
    if (!state.formVisible) return
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  function runSave(e: KeyboardEvent) {
    if (!state.formVisible) return
    if (props.quickEdit && state.formActionType === 'update') return
    e.preventDefault()
    onSave()
  }

  /**
   * 键盘快捷键（仅组件获焦时生效）：
   * - Esc          关闭表单
   * - ⌘/Ctrl + S   保存（快速编辑模式下编辑行时除外）
   */
  function handleKeydown(e: KeyboardEvent) {
    if (!focused.value) return
    if (props.readonly && e.key !== 'Escape') return

    if (e.key === 'Escape') return runEscape(e)

    const meta = e.metaKey || e.ctrlKey
    if (!meta) return

    const key = e.key.toLowerCase()

    if (key === 's') return runSave(e)
  }

  return { focused, handleFocusIn, handleFocusOut, handleKeydown }
}
