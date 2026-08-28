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

  it('nav sidebar defaults to dark variant, resolved per series', () => {
    // light 系列：深底（text-color.title）+ 浅前景，与浅色内容区拉开区分度
    const lightDecls = lightTheme.navSidebarDecls(lightTheme.theme)
    expect(lightDecls).toContain('--u-nav-bg-color: var(--u-text-color-title)')
    expect(lightDecls).toContain('--u-nav-color: rgba(255, 255, 255, 0.72)')
    // dark 系列：侧栏比内容区 top 深一档
    const darkDecls = darkTheme.navSidebarDecls(darkTheme.theme)
    expect(darkDecls).toContain('--u-nav-bg-color: var(--u-bg-color-middle)')
    expect(darkDecls).toContain('--u-nav-color: var(--u-text-color-main)')
  })

  it('nav variant light switches to light sidebar tokens', () => {
    const t = lightTheme.new({ nav: { variant: 'light' } })
    const decls = t.navSidebarDecls(t.theme)
    expect(decls).toContain('--u-nav-bg-color: var(--u-bg-color-middle)')
    expect(decls).toContain('--u-nav-color: var(--u-text-color-title)')
  })

  it('hero preset defaults to light sidebar variant', () => {
    const decls = heroTheme.navSidebarDecls(heroTheme.theme)
    expect(decls).toContain('--u-nav-bg-color: var(--u-bg-color-middle)')
  })

  it('theme.nav overrides are appended after variant defaults and win', () => {
    const t = lightTheme.new({ nav: { 'bg-color': '#123456' } })
    const decls = t.navSidebarDecls(t.theme)
    const bgDecls = decls.filter((d) => d.startsWith('--u-nav-bg-color:'))
    expect(bgDecls.length).toBe(2)
    expect(bgDecls[1]).toBe('--u-nav-bg-color: #123456')
  })

  it('renderBase skips the nav subtree (handled by navSidebarDecls)', () => {
    const decls = sakuraTheme.themeToDeclarationList(sakuraTheme.theme)
    expect(decls.some((d) => d.startsWith('--u-nav-'))).toBe(false)
  })

  it('sakura / ocean / ancient have themed dark sidebar colors', () => {
    expect(sakuraTheme.navSidebarDecls(sakuraTheme.theme)).toContain('--u-nav-bg-color: #662e40')
    expect(oceanTheme.navSidebarDecls(oceanTheme.theme)).toContain('--u-nav-bg-color: #134944')
    expect(ancientTheme.navSidebarDecls(ancientTheme.theme)).toContain('--u-nav-bg-color: #303c34')
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
