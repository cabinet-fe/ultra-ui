import type { LexicalEditor } from 'lexical'
import { onBeforeUnmount } from 'vue'
import { clearDragVisualState } from './use-expression-drag-drop'
import { registerCommandPacks } from './internal/features/commands/register-command-packs'

export interface RegisterPlainTextOptions {
  /** Optional context-key commands registration (e.g. from use-context). Merged when provided. */
  getContextCommands?: () => () => void
}

/**
 * Registers plain-text editing commands for the expression editor.
 * Delegates to capability command packs (text-editing, clipboard, drag-drop, optional context-keys).
 */
export function registerPlainText(
  editor: LexicalEditor,
  options?: RegisterPlainTextOptions
): void {
  const removeListener = registerCommandPacks(editor, {
    getContextCommands: options?.getContextCommands
  })

  onBeforeUnmount(() => {
    clearDragVisualState(editor)
    removeListener()
  })
}
