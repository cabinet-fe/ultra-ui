import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor
} from 'lexical'

import { $createVariableNode } from '../../../nodes/variable-node'

export interface InsertVariableInput {
  nodeKey: string
  charPosition: number
  variable: { value: string; label: string; type?: string }
}

/**
 * Typed mutation gateway for variable insertion at @ trigger.
 * Must be called inside editor.update or via a gateway that runs updates.
 */
export function insertVariableAtTrigger(
  editor: LexicalEditor,
  input: InsertVariableInput
): boolean {
  let result = false

  editor.update(() => {
    const targetNode = $getNodeByKey(input.nodeKey)
    if (!targetNode) return

    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const focusNode = selection.focus.getNode()
    if (focusNode.getKey() !== targetNode.getKey()) return

    const textContent = targetNode.getTextContent()
    if (!textContent?.includes('@')) return

    const pos = input.charPosition
    const newNode = $createVariableNode(
      input.variable.value,
      input.variable.label,
      input.variable.type
    )
    const nodeBefore = $createTextNode(textContent.slice(0, pos - 1))
    const nodeAfter = $createTextNode(textContent.slice(pos))
    targetNode.replace(nodeBefore)
    nodeBefore.insertAfter(newNode)
    newNode.insertAfter(nodeAfter)
    newNode.selectEnd()
    result = true
  })

  return result
}
