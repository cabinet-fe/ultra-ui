// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'

import {
  componentCssVarsDark,
  componentCssVarsLight,
  navSidebarTokens,
  navSurfaceTokens,
  navSurfaceTone
} from '../component-css-vars'
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
    // 3 位 hex（如预设里的 white: '#fff'）同样要推导 alpha token，缺失会导致引用它的整条声明失效
    expect(decls.some((d) => d.startsWith('--u-text-color-white-a-86:'))).toBe(true)
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

  it('emits danger focus ring for error state', () => {
    expect(componentCssVarsLight['--u-focus-ring-danger']).toContain('--u-color-danger-a-28')
    expect(componentCssVarsDark['--u-focus-ring-danger']).toContain('--u-color-danger-a-35')
  })

  it('emits select, auto-complete, and contextmenu component vars', () => {
    expect(componentCssVarsLight['--u-select-option-hover-bg']).toBe('var(--u-bg-color-hover)')
    expect(componentCssVarsLight['--u-select-option-selected-bg']).toBe(
      'var(--u-color-primary-light-9)'
    )
    expect(componentCssVarsDark['--u-select-option-selected-bg']).toBe(
      'var(--u-color-primary-dark-9)'
    )
    expect(componentCssVarsLight['--u-auto-complete-option-selected-bg']).toBe(
      'var(--u-color-primary-light-9)'
    )
    expect(componentCssVarsDark['--u-auto-complete-option-selected-bg']).toBe(
      'var(--u-color-primary-dark-9)'
    )
    expect(componentCssVarsLight['--u-contextmenu-item-hover-bg']).toBe('var(--u-bg-color-hover)')
    expect(componentCssVarsLight['--u-contextmenu-item-height-default']).toBe('28px')
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

  it('nav.variants overrides apply only to their own variant', () => {
    const t = ancientTheme.new({ nav: { variants: { light: { 'bg-color': '#f1ede0' } } } })
    // 深变体（预设自带松烟墨）不受 light 变体覆盖影响
    const darkDecls = t.navSidebarDecls(t.theme)
    expect(darkDecls).toContain('--u-nav-bg-color: #303c34')
    expect(darkDecls).not.toContain('--u-nav-bg-color: #f1ede0')
    // 浅变体使用 variants.light 覆盖
    const lightDecls = t.navSidebarDecls(t.theme, 'light')
    expect(lightDecls).toContain('--u-nav-bg-color: #f1ede0')
    expect(lightDecls).not.toContain('--u-nav-bg-color: #303c34')
  })

  it('nav top-level overrides still apply to every variant and lose to variants', () => {
    const t = lightTheme.new({
      nav: { 'hover-bg': '#111111', variants: { light: { 'hover-bg': '#222222' } } }
    })
    expect(t.navSidebarDecls(t.theme)).toContain('--u-nav-hover-bg: #111111')
    const lightDecls = t.navSidebarDecls(t.theme, 'light')
    expect(lightDecls).toContain('--u-nav-hover-bg: #111111')
    expect(lightDecls).toContain('--u-nav-hover-bg: #222222')
  })

  it('withNavVariant derives a theme with the requested menu variant', () => {
    const lightVariant = lightTheme.withNavVariant('light')
    const lightDecls = lightVariant.navSidebarDecls(lightVariant.theme)
    expect(lightDecls).toContain('--u-nav-bg-color: var(--u-bg-color-middle)')
    // 浅底选中文字用更深的 primary，保证 13px 正文对比度
    expect(lightDecls).toContain('--u-nav-active-color: var(--u-color-primary-dark-3)')
    // hero 默认 light 变体，派生 dark 变体后回落到深墨侧栏
    const heroDark = heroTheme.withNavVariant('dark')
    expect(heroDark.navSidebarDecls(heroDark.theme)).toContain(
      '--u-nav-bg-color: var(--u-text-color-title)'
    )
  })

  it('nav surface tone reflects the real surface luminance', () => {
    expect(navSurfaceTone('light', 'dark')).toBe('dark')
    expect(navSurfaceTone('light', 'light')).toBe('light')
    expect(navSurfaceTone('dark', 'dark')).toBe('dark')
    // 深色系列的 light 变体只是提亮一档，表面仍是深底
    expect(navSurfaceTone('dark', 'light')).toBe('dark')
  })

  it('nav tokens carry surface decoration tokens matching the surface tone', () => {
    expect(navSidebarTokens('light', 'dark')['--u-nav-surface-hairline']).toBe(
      'rgba(255, 255, 255, 0.07)'
    )
    expect(navSidebarTokens('light', 'light')['--u-nav-surface-hairline']).toBe(
      'var(--u-border-color)'
    )
    // dark 系列的 light 变体表面仍是深底，装饰沿用深底那套
    expect(navSidebarTokens('dark', 'light')['--u-nav-surface-hairline']).toBe(
      'rgba(255, 255, 255, 0.07)'
    )
    expect(navSurfaceTokens('light', 'light')['--u-nav-surface-accent']).toBe(
      'var(--u-color-primary)'
    )
  })

  it('render emits container-level variant rules and html surface tone', () => {
    if (typeof document === 'undefined') return
    lightTheme.render()
    const adopted = [...document.adoptedStyleSheets]
      .flatMap((sheet) => sheet.cssRules.map((rule) => rule.cssText))
      .join('\n')
    const fallback = document.getElementById('ultra-ui-theme')?.textContent ?? ''
    const css = adopted || fallback
    expect(css).toContain('html[data-theme="light"] [data-nav-variant="dark"]')
    expect(css).toContain('html[data-theme="dark"] [data-nav-variant="light"]')
    // lightTheme 默认 dark 菜单：html 级实际底色色调为深底
    expect(document.documentElement.dataset.navSurface).toBe('dark')
    darkTheme.render()
    expect(document.documentElement.dataset.navSurface).toBe('dark')
  })

  it('navSidebarColors resolves concrete colors for theme previews', () => {
    const lightColors = lightTheme.navSidebarColors()
    expect(lightColors['bg-color']).toBe('#18181b')
    expect(lightColors['color']).toBe('rgba(255, 255, 255, 0.72)')
    expect(lightColors['surface-hairline']).toBe('rgba(255, 255, 255, 0.07)')

    const lightMenu = lightTheme.navSidebarColors('light')
    expect(lightMenu['bg-color']).toBe('#fafafa')
    expect(lightMenu['color']).toBe('#18181b')
    expect(lightMenu['active-color']).toMatch(/^#[0-9a-f]{6}$/i)

    // 预设个性侧栏色按变体隔离
    expect(ancientTheme.navSidebarColors()['bg-color']).toBe('#303c34')
    expect(ancientTheme.navSidebarColors('light')['bg-color']).toBe('#f7f4ea')
    expect(heroTheme.navSidebarColors()['bg-color']).toBe('#fafafa')
    expect(heroTheme.navSidebarColors('dark')['bg-color']).toBe('#11181C')
  })
})
