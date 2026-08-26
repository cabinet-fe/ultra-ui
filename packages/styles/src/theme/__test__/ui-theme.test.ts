import { describe, expect, it } from 'vitest'

import { componentCssVarsDark, componentCssVarsLight } from '../component-css-vars'
import {
  ancientTheme,
  darkTheme,
  glassTheme,
  heroTheme,
  lightTheme,
  midnightTheme,
  neonTheme,
  oceanTheme,
  sakuraTheme
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

  it('render writes data-theme from theme series', () => {
    if (typeof document === 'undefined') return
    const el = document.documentElement
    darkTheme.render()
    expect(el.dataset.theme).toBe('dark')
    lightTheme.render()
    expect(el.dataset.theme).toBe('light')
  })

  it('derived themes inherit series unless overridden', () => {
    expect(darkTheme.series).toBe('dark')
    expect(glassTheme.series).toBe('dark')
    expect(heroTheme.series).toBe('light')
    expect(ancientTheme.series).toBe('light')
    expect(sakuraTheme.series).toBe('light')
    expect(oceanTheme.series).toBe('light')
    expect(midnightTheme.series).toBe('dark')
    expect(neonTheme.series).toBe('dark')
    expect(lightTheme.new({}).series).toBe('light')
    expect(lightTheme.new({}, { series: 'dark' }).series).toBe('dark')
  })

  it('renderAlphaTokens emits semantic color alpha vars', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-color-primary-a-8:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-border-color-a-52:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-text-color-second-a-28:'))).toBe(true)
  })

  it('renderComponentMixTokens emits batch-edit and kbd vars', () => {
    const decls = lightTheme.themeToDeclarationList(lightTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-kbd-inset-shadow:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-batch-edit-form-header-bg:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-collapse-item-bg:'))).toBe(false)
  })

  it('glass declares kbd and batch-edit vars explicitly (non-hex bg skips mix tokens)', () => {
    const decls = glassTheme.themeToDeclarationList(glassTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-kbd-inset-shadow:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-kbd-border-shadow:'))).toBe(true)
    expect(decls.some((d) => d.startsWith('--u-kbd-drop-shadow:'))).toBe(true)
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
    const themes = [
      lightTheme,
      darkTheme,
      heroTheme,
      glassTheme,
      ancientTheme,
      sakuraTheme,
      oceanTheme,
      midnightTheme,
      neonTheme
    ]
    for (const t of themes) {
      const decls = t.themeToDeclarationList(t.theme)
      for (const d of decls) {
        expect(d).not.toContain('NaN')
      }
    }
  })
})
