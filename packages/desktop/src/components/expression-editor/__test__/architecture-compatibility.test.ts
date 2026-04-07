/**
 * ARCH-02: Public API compatibility gate.
 * Locks export surface, props, and emits so future changes cannot break consumers.
 * Failure here maps directly to roadmap acceptance criteria.
 */
import { describe, expect, it, vi } from 'vitest'
import type { ExpressionEditorEmits, ExpressionEditorProps, VariableItem } from '@ultra-ui/desktop/types'

vi.mock('../expression-editor.vue', () => ({
  default: { name: 'ExpressionEditor' }
}))

import { UExpressionEditor } from '../index'

describe('ARCH-02: UExpressionEditor public API compatibility', () => {
  it('UExpressionEditor is importable and is a Vue component', () => {
    expect(UExpressionEditor).toBeDefined()
    expect(typeof UExpressionEditor).toBe('object')
    expect(UExpressionEditor).toHaveProperty('name', 'ExpressionEditor')
  })

  it('ExpressionEditorProps has required keys: modelValue, placeholder, variables', () => {
    const requiredKeys: (keyof ExpressionEditorProps)[] = [
      'modelValue',
      'placeholder',
      'variables'
    ]
    const props: ExpressionEditorProps = {
      modelValue: '',
      placeholder: 'test',
      variables: []
    }
    for (const key of requiredKeys) {
      expect(key in props || typeof (props as Record<string, unknown>)[key] !== 'undefined').toBe(
        true
      )
    }
  })

  it('ExpressionEditorProps modelValue accepts string', () => {
    const props: ExpressionEditorProps = {
      modelValue: 'hello{foo}'
    }
    expect(props.modelValue).toBe('hello{foo}')
  })

  it('ExpressionEditorProps variables accepts VariableItem[]', () => {
    const items: VariableItem[] = [
      { label: 'Foo', value: 'foo' },
      { label: 'Bar', value: 'bar', type: 'string' }
    ]
    const props: ExpressionEditorProps = {
      variables: items
    }
    expect(props.variables).toEqual(items)
  })

  it('update:modelValue emit signature: (e, value: string) => void', () => {
    const emit: ExpressionEditorEmits = (e: 'update:modelValue', value: string) => {
      expect(e).toBe('update:modelValue')
      expect(typeof value).toBe('string')
    }
    emit('update:modelValue', 'new value')
  })
})
