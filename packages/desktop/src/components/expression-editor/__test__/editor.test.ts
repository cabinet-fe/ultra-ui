// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

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
