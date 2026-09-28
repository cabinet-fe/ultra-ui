// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { createEditor } from '../core/editor'
import { parse } from '../core/model'

const B = 'u-expression-editor'
const cls = {
  b: B,
  e: (n: string) => `${B}__${n}`,
  m: (n: string) => `${B}--${n}`,
  em: (e: string, m: string) => `${B}__${e}--${m}`,
  create: () => cls
} as any

afterEach(() => {
  document.body.innerHTML = ''
  document.getSelection()?.removeAllRanges()
})

describe('createEditor composition', () => {
  it('does not emit selection changes while IME composition text is pending', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onChange = vi.fn()
    const onSelectionChange = vi.fn()
    const editor = createEditor({
      container,
      cls,
      initialDoc: parse('@'),
      onChange,
      onSelectionChange
    })

    container.dispatchEvent(new Event('compositionstart'))
    container.querySelector('[data-seg="text"]')!.textContent = '@n'
    container.dispatchEvent(new Event('input'))
    editor.setCaretOffset(2)
    document.dispatchEvent(new Event('selectionchange'))

    expect(onChange).not.toHaveBeenCalled()
    expect(onSelectionChange).not.toHaveBeenCalled()

    editor.dispose()
  })
})

describe('createEditor visual empty', () => {
  function setup(initialValue: string) {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onVisualEmptyChange = vi.fn()
    const editor = createEditor({
      container,
      cls,
      initialDoc: parse(initialValue),
      onVisualEmptyChange
    })
    return { container, editor, onVisualEmptyChange }
  }

  function textSpan(container: HTMLElement): HTMLElement {
    return container.querySelector('[data-seg="text"]')!
  }

  it('reports empty on first render, non-empty once a chip is present', () => {
    const empty = setup('')
    expect(empty.onVisualEmptyChange).toHaveBeenLastCalledWith(true)
    empty.editor.dispose()

    const withChip = setup('{user}')
    expect(withChip.onVisualEmptyChange).toHaveBeenLastCalledWith(false)
    withChip.editor.dispose()
  })

  it('drops the empty state as soon as IME composition text is in the DOM', () => {
    const { container, editor, onVisualEmptyChange } = setup('')

    container.dispatchEvent(new Event('compositionstart'))
    textSpan(container).textContent = '阿'
    container.dispatchEvent(new Event('input'))

    expect(onVisualEmptyChange).toHaveBeenLastCalledWith(false)

    editor.dispose()
  })

  it('restores the empty state when composition text is deleted mid-composition', () => {
    const { container, editor, onVisualEmptyChange } = setup('')

    container.dispatchEvent(new Event('compositionstart'))
    textSpan(container).textContent = '阿'
    container.dispatchEvent(new Event('input'))
    textSpan(container).textContent = ''
    container.dispatchEvent(new Event('input'))

    expect(onVisualEmptyChange).toHaveBeenLastCalledWith(true)

    editor.dispose()
  })

  it('keeps the empty state while composition has no visible text yet', () => {
    const { container, editor, onVisualEmptyChange } = setup('')

    container.dispatchEvent(new Event('compositionstart'))

    expect(onVisualEmptyChange).toHaveBeenCalledTimes(1)

    editor.dispose()
  })
})
