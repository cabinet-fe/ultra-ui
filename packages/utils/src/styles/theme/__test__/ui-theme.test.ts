import { describe, expect, it } from 'vitest'
import { lightTheme } from '../light'
import { UITheme } from '../ui-theme'

describe('UITheme', () => {
  it('themeToDeclarationList emits only --u-prefixed custom properties', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some(d => d.startsWith('--u-color-primary:'))).toBe(true)
    for (const d of decls) {
      const name = d.split(':')[0]?.trim()
      if (!name) continue
      expect(name.startsWith('--u-')).toBe(true)
    }
  })

  it('setTheme toggles data-theme on documentElement', () => {
    if (typeof document === 'undefined') return
    const el = document.documentElement
    UITheme.setTheme('dark')
    expect(el.dataset.theme).toBe('dark')
    UITheme.setTheme('light')
    expect(el.dataset.theme).toBe('light')
    UITheme.setTheme('auto')
    expect(el.dataset.theme).toBeUndefined()
  })
})
