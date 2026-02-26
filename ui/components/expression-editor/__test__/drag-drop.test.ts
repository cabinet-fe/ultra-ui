import { vi } from 'vitest'
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  type LexicalEditor
} from 'lexical'
import { VariableNode } from '../nodes/variable-node'

vi.mock('../../tag', () => ({
  UTag: () => null
}))

import { parseContent } from '../parser'
import {
  applyDropReorder,
  collectVariableNodeDescriptors,
  createInternalDragPayload,
  moveVariableByDirection,
  reorderVariableNode
} from '../use-expression-drag-drop'

function createTestEditor(content: string): LexicalEditor {
  const editor = createEditor({
    namespace: 'ExpressionEditorDragDropTest',
    nodes: [VariableNode],
    onError: () => {}
  })

  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append(...parseContent(content))
      root.append(paragraph)
    },
    { discrete: true }
  )

  return editor
}

function getEditorText(editor: LexicalEditor): string {
  let text = ''
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent()
  })
  return text
}

function stripVariableTokens(content: string): string {
  return content.replace(/\{[^}]+\}/g, '')
}

function getVariableOrder(editor: LexicalEditor): string[] {
  return collectVariableNodeDescriptors(editor).map(item => item.variable)
}

function getVariableKey(editor: LexicalEditor, variable: string): string {
  const descriptor = collectVariableNodeDescriptors(editor).find(
    item => item.variable === variable
  )
  if (!descriptor) {
    throw new Error(`Cannot find variable: ${variable}`)
  }
  return descriptor.key
}

describe('expression drag drop', () => {
  it('reorders variable sequence correctly', () => {
    const editor = createTestEditor('A {first} + {second} + {third}')
    const secondKey = getVariableKey(editor, 'second')

    let moved = false
    editor.update(
      () => {
        moved = reorderVariableNode(secondKey, 0, false)
      },
      { discrete: true }
    )

    expect(moved).toBe(true)
    expect(getVariableOrder(editor)).toEqual(['second', 'first', 'third'])
  })

  it('keeps plain text and whitespace unchanged while reordering variables', () => {
    const editor = createTestEditor('left  {alpha}\t+\n{beta} right')
    const before = getEditorText(editor)
    const betaKey = getVariableKey(editor, 'beta')

    editor.update(
      () => {
        reorderVariableNode(betaKey, 0, false)
      },
      { discrete: true }
    )

    const after = getEditorText(editor)
    expect(stripVariableTokens(after)).toBe(stripVariableTokens(before))
    expect(getVariableOrder(editor)).toEqual(['beta', 'alpha'])
  })

  it('ignores invalid or external payload without changing content', () => {
    const editor = createTestEditor('x {foo} y {bar}')
    const initial = getEditorText(editor)

    let moved = true
    editor.update(
      () => {
        moved = applyDropReorder({
          payloadText: '{"action":"move-variable","scopeId":"scope-a"}',
          scopeId: 'scope-a',
          targetSlot: 0,
          focusMovedNode: false
        })
      },
      { discrete: true }
    )

    expect(moved).toBe(false)
    expect(getEditorText(editor)).toBe(initial)
  })

  it('uses the same reorder behavior for fallback move and drop payload', () => {
    const input = 'start {a} middle {b} end {c}'
    const fallbackEditor = createTestEditor(input)
    const dropEditor = createTestEditor(input)

    const fallbackKey = getVariableKey(fallbackEditor, 'b')
    const dropKey = getVariableKey(dropEditor, 'b')

    let fallbackMoved = false
    fallbackEditor.update(
      () => {
        fallbackMoved = moveVariableByDirection(fallbackKey, -1, false)
      },
      { discrete: true }
    )

    let dropMoved = false
    dropEditor.update(
      () => {
        const payload = createInternalDragPayload({
          action: 'move-variable',
          sourceKey: dropKey,
          scopeId: 'scope-04-test'
        })
        dropMoved = applyDropReorder({
          payloadText: payload,
          scopeId: 'scope-04-test',
          targetSlot: 0,
          focusMovedNode: false
        })
      },
      { discrete: true }
    )

    expect(fallbackMoved).toBe(true)
    expect(dropMoved).toBe(true)
    expect(getEditorText(dropEditor)).toBe(getEditorText(fallbackEditor))
    expect(getVariableOrder(dropEditor)).toEqual(getVariableOrder(fallbackEditor))
  })
})
