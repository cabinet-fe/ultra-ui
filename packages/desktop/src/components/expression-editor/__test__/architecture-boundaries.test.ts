/**
 * ARCH-01: Capability boundary and key wiring regression gate.
 * Verifies sync/insertion/drag-drop/rendering have independent entry points
 * and runtime -> command packs -> mutation services wiring is intact.
 * Failure maps to roadmap acceptance criteria.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../tag', () => ({
  UTag: () => null
}))
import { createEditor } from 'lexical'
import { ref, shallowRef } from 'vue'
import { VariableNode } from '../nodes/variable-node'
import { createExpressionEditorRuntime } from '../internal/editor-runtime'
import { registerCommandPacks } from '../internal/features/commands/register-command-packs'
import { insertVariableAtTrigger } from '../internal/features/insertion/insertion-service'
import {
  moveVariableByDirection,
  reorderVariable
} from '../internal/features/drag-drop/drag-drop-service'
import type { ExpressionEditorRuntime } from '../internal/contracts/editor-runtime'

describe('ARCH-01: sync boundary', () => {
  it('createExpressionEditorRuntime returns runtime with editor, mutations, syncFromModelValue', () => {
    const container = shallowRef<HTMLElement | null>(null)
    const props = { modelValue: '', variables: [] }
    const emit = () => {}
    const cls = { b: 'expression-editor', e: (s: string) => `expression-editor__${s}` } as const

    const runtime = createExpressionEditorRuntime({
      disabled: ref(false),
      readonly: ref(false),
      props,
      cls,
      emit,
      container
    })

    expect(runtime).toHaveProperty('editor')
    expect(runtime).toHaveProperty('mutations')
    expect(runtime).toHaveProperty('syncFromModelValue')
    expect(typeof runtime.syncFromModelValue).toBe('function')
    expect(runtime.mutations).toHaveProperty('runUpdate')
    expect(typeof runtime.mutations.runUpdate).toBe('function')
  })

  it('EditorMutationGateway.runUpdate executes updater inside editor.update', () => {
    const container = shallowRef<HTMLElement | null>(null)
    const props = { modelValue: '', variables: [] }
    const emit = () => {}
    const cls = { b: 'expression-editor', e: (s: string) => `expression-editor__${s}` } as const

    const runtime = createExpressionEditorRuntime({
      disabled: ref(false),
      readonly: ref(false),
      props,
      cls,
      emit,
      container
    }) as ExpressionEditorRuntime

    let executed = false
    runtime.mutations.runUpdate(() => {
      executed = true
    })
    expect(executed).toBe(true)
  })
})

describe('ARCH-01: insertion boundary', () => {
  it('insertVariableAtTrigger is callable and returns boolean', () => {
    const editor = createEditor({
      namespace: 'Test',
      nodes: [VariableNode],
      onError: () => {}
    })
    const result = insertVariableAtTrigger(editor, {
      nodeKey: 'nonexistent',
      charPosition: 0,
      variable: { value: 'x', label: 'X' }
    })
    expect(typeof result).toBe('boolean')
  })
})

describe('ARCH-01: drag-drop boundary', () => {
  it('reorderVariable is callable and returns boolean', () => {
    const editor = createEditor({
      namespace: 'Test',
      nodes: [VariableNode],
      onError: () => {}
    })
    const result = reorderVariable(editor, {
      payloadText: null,
      scopeId: 'test',
      targetSlot: 0
    })
    expect(typeof result).toBe('boolean')
  })

  it('moveVariableByDirection is callable and returns boolean', () => {
    const editor = createEditor({
      namespace: 'Test',
      nodes: [VariableNode],
      onError: () => {}
    })
    const result = moveVariableByDirection(editor, 'nonexistent-key', -1, false)
    expect(typeof result).toBe('boolean')
  })
})

describe('ARCH-01: command packs boundary', () => {
  it('registerCommandPacks returns cleanup function', () => {
    const editor = createEditor({
      namespace: 'Test',
      nodes: [VariableNode],
      onError: () => {}
    })
    const cleanup = registerCommandPacks(editor)
    expect(typeof cleanup).toBe('function')
    cleanup()
  })
})
