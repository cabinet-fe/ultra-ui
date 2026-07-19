import { describe, expect, it } from 'vitest'

import { componentCssVarsDark, componentCssVarsLight } from '../component-css-vars'
import {
  darkTheme,
  glassLightTheme,
  heroLightTheme,
  lightTheme,
  shadcnLightTheme
} from '../presets'
import { UITheme } from '../ui-theme'

describe('UITheme', () => {
  it('themeToDeclarationList emits only --u-prefixed custom properties', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-color-primary:'))).toBe(true)
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

  it('includes collapse component title color token in built-in component vars', () => {
    expect(componentCssVarsLight['--u-collapse-title-color']).toBe('var(--u-text-color-main)')
    expect(componentCssVarsDark['--u-collapse-title-color']).toBe('var(--u-text-color-main)')
  })

  it('renderAlphaTokens emits semantic color alpha vars', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-color-primary-a-8:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-border-color-a-52:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-text-color-second-a-28:'))).toBe(true)
  })

  it('renderComponentMixTokens emits collapse and kbd vars', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-collapse-item-bg:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-kbd-inset-shadow:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-batch-edit-form-header-bg:'))).toBe(true)
  })

  it('emits elevation and motion tokens', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-shadow-sm:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-shadow-lg:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-transition-fast:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-transition-ease-out:'))).toBe(true)
  })

  it('emits focus ring component var', () => {
    expect(componentCssVarsLight['--u-focus-ring']).toContain('--u-color-primary-a-')
    expect(componentCssVarsDark['--u-focus-ring']).toContain('--u-color-primary-a-')
  })

  it('no preset emits invalid NaN declarations', () => {
    const themes = [lightTheme, darkTheme, shadcnLightTheme, heroLightTheme, glassLightTheme]
    for (const t of themes) {
      const decls = t.themeToDeclarationList(t.theme)
      for (const d of decls) {
        expect(d).not.toContain('NaN')
      }
    }
  })
})
