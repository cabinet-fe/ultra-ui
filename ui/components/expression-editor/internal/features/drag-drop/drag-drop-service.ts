import type { LexicalEditor } from 'lexical'
import {
  applyDropReorder,
  moveVariableByDirection as moveVariableByDirectionImpl
} from '../../../use-expression-drag-drop'

export interface ReorderVariableInput {
  payloadText: string | null
  scopeId: string
  targetSlot: number
  focusMovedNode?: boolean
}

/**
 * Typed mutation gateway for variable reorder via drop payload.
 * Runs update internally; all mutations go through editor.update.
 */
export function reorderVariable(
  editor: LexicalEditor,
  input: ReorderVariableInput
): boolean {
  let result = false

  editor.update(() => {
    result = applyDropReorder({
      payloadText: input.payloadText,
      scopeId: input.scopeId,
      targetSlot: input.targetSlot,
      focusMovedNode: input.focusMovedNode ?? true
    })
  })

  return result
}

/**
 * Typed mutation gateway for variable reorder via fallback move up/down.
 * Runs update internally; shares same reorder path as native drop.
 */
export function moveVariableByDirection(
  editor: LexicalEditor,
  sourceKey: string,
  direction: -1 | 1,
  focusMovedNode = true
): boolean {
  let result = false

  editor.update(() => {
    result = moveVariableByDirectionImpl(
      sourceKey,
      direction,
      focusMovedNode
    )
  })

  return result
}
