// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import { ChipAttrs, createChip, isChipElement, readChipValue, setChipFocused } from '../core/chip'

// 本地最小 BEM 实例：避免引入 @veltra/utils → vue 间接依赖在 happy-dom 环境下触发 .d.mts 解析失败
const B = 'u-expression-editor'
const cls = {
  b: B,
  e: (n: string) => `${B}__${n}`,
  m: (n: string) => `${B}--${n}`,
  em: (e: string, m: string) => `${B}__${e}--${m}`,
  create: () => cls
} as any

function makeChip(overrides: Partial<{ value: string; label: string; type?: string }> = {}) {
  const onRemove = vi.fn<(el: HTMLElement) => void>()
  const onReselect = vi.fn<(el: HTMLElement) => void>()
  const segment = {
    kind: 'var' as const,
    value: overrides.value ?? 'form.user.name',
    label: overrides.label ?? '用户姓名',
    ...(overrides.type ? { type: overrides.type } : {})
  }
  const el = createChip(segment, { cls, onRemove, onReselect })
  return { el, onRemove, onReselect, segment }
}

describe('createChip', () => {
  it('renders chip with data-seg, data-value and contenteditable=false', () => {
    const { el, segment } = makeChip()
    expect(el.getAttribute(ChipAttrs.seg)).toBe('var')
    expect(el.getAttribute(ChipAttrs.value)).toBe(segment.value)
    expect(el.getAttribute('contenteditable')).toBe('false')
    expect(el.className).toContain('u-expression-editor__chip')
  })

  it('renders label with type suffix when type provided', () => {
    const { el } = makeChip({ value: 'x', label: '名称', type: 'string' })
    expect(el.textContent).toContain('名称 (string)')
  })

  it('renders label without type suffix when type is absent', () => {
    const { el } = makeChip({ value: 'x', label: '名称' })
    expect(el.textContent).toContain('名称')
    expect(el.textContent).not.toContain('(')
  })

  it('isChipElement detects chip nodes', () => {
    const { el } = makeChip()
    expect(isChipElement(el)).toBe(true)
    expect(isChipElement(document.createElement('span'))).toBe(false)
    expect(isChipElement(null)).toBe(false)
  })

  it('mousedown on chip body triggers onReselect', () => {
    const { el, onReselect, onRemove } = makeChip()
    const label = el.querySelector(`.${cls.e('chip-label')}`) as HTMLElement
    label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onReselect).toHaveBeenCalledTimes(1)
    expect(onReselect).toHaveBeenCalledWith(el)
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('mousedown on close (×) triggers onRemove and not onReselect', () => {
    const { el, onReselect, onRemove } = makeChip()
    const close = el.querySelector(`[${ChipAttrs.close}]`) as HTMLElement
    close.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith(el)
    expect(onReselect).not.toHaveBeenCalled()
  })

  it('readChipValue returns the bound value', () => {
    const { el } = makeChip({ value: 'a.b.c' })
    expect(readChipValue(el)).toBe('a.b.c')
  })

  it('setChipFocused toggles is-focused class', () => {
    const { el } = makeChip()
    setChipFocused(el, true)
    expect(el.classList.contains('is-focused')).toBe(true)
    setChipFocused(el, false)
    expect(el.classList.contains('is-focused')).toBe(false)
  })
})
