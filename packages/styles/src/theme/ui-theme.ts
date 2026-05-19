import { isObj, o, str } from '@cat-kit/core'
import { withUnit } from '@veltra/utils'
import { reactive, toRaw, watch } from 'vue'

import { componentCssVarsDarkDecls, componentCssVarsLightDecls } from './component-css-vars'
import { mixColor } from './helper'
import type { Theme } from './type'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P]
}

export class UITheme {
  static themeID = 'ultra-ui-theme'

  private static adoptedSheet: CSSStyleSheet | null = null

  readonly theme: Theme

  private readonly reactiveEnabled: boolean

  constructor(theme: Theme, options?: { reactive?: boolean }) {
    this.reactiveEnabled = options?.reactive !== false
    this.theme = reactive(theme) as Theme
    if (this.reactiveEnabled) {
      watch(this.theme, () => this.render(), { deep: true })
    }
  }

  static setTheme(mode: 'light' | 'dark' | 'auto'): void {
    if (typeof document === 'undefined') return
    const el = document.documentElement
    if (mode === 'auto') {
      delete el.dataset.theme
    } else {
      el.dataset.theme = mode
    }
  }

  private renderBase(
    theme: Record<string, unknown>,
    themeRules: string[] = [],
    parentKey = '--u'
  ): string[] {
    Object.keys(theme).forEach((key) => {
      const value = theme[key]
      const varKey = `${parentKey.startsWith('-') ? parentKey : str(parentKey).kebabCase()}-${str(key).kebabCase()}`
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.renderBase(value as Record<string, unknown>, themeRules, varKey)
      } else {
        if (value || value === 0) {
          const v = withUnit(value as number | string, 'px')
          if (v !== undefined) {
            themeRules.push(`${varKey}: ${v}`)
          }
        }
      }
    })

    return themeRules
  }

  private renderBorder(theme: Theme): string {
    const shorthandKeys = (Object.keys(theme.border) as Array<keyof typeof theme.border>).filter(
      (key) => key !== 'mutedColor'
    )
    const border = shorthandKeys.map((key) => `var(--u-border-${key})`).join(' ')

    return [
      `--u-border: ${border}`,
      `--u-border-muted: var(--u-border-muted-color) var(--u-border-width) var(--u-border-style)`
    ].join(';')
  }

  private renderTypeColor(theme: Theme): string {
    const { color } = theme

    const types = Object.keys(color)
    const rates = [1, 3, 5, 7, 9]

    return types
      .map((type) => {
        const colorValue = color[type as keyof typeof color]! as `#${string}`

        return rates
          .map((rate) => {
            const light = `--u-color-${type}-light-${rate}: ${mixColor(
              colorValue,
              '#fff',
              rate / 10
            )}`
            const dark = `--u-color-${type}-dark-${rate}: ${mixColor(
              colorValue,
              '#000',
              rate / 10
            )}`
            return `${light};${dark}`
          })
          .join(';')
      })
      .join(';')
  }

  private renderShadow(_theme: Theme): string {
    const shadow = ['x', 'y', 'blur', 'spread', 'color']
      .map((k) => `var(--u-shadow-${k})`)
      .join(' ')

    return `--u-shadow: ${shadow}`
  }

  private renderBGColorAlpha(theme: Theme): string {
    const { color } = theme.bg
    return Object.keys(color)
      .map((type) => `--u-bg-color-${type}-alpha: ${color[type as keyof typeof color]}aa`)
      .join(';')
  }

  private renderBGFilter(theme: Theme): string {
    const { filter } = theme.bg
    const value = filter.blur === 'none' ? 'none' : `${filter.blur} ${filter.saturate}`
    return `--u-bg-filter: ${value}`
  }

  /** 主题变量声明列表，均为 `--u-` 前缀的 CSS 自定义属性 */
  themeToDeclarationList(theme: Theme): string[] {
    const raw = theme as unknown as Record<string, unknown>
    const lines: string[] = [...this.renderBase(raw)]
    const chunks = [
      this.renderTypeColor(theme),
      this.renderShadow(theme),
      this.renderBGColorAlpha(theme),
      this.renderBGFilter(theme),
      this.renderBorder(theme)
    ]
    for (const c of chunks) {
      lines.push(
        ...c
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    }
    return lines
  }

  private static declarationBlock(decls: string[]): string {
    return decls.join(';')
  }

  private static removeExistingStyleTag(doc: Document): void {
    const el = doc.getElementById(UITheme.themeID)
    if (el?.parentNode) {
      el.parentNode.removeChild(el)
    }
  }

  private static applyGlobalCSS(css: string): void {
    const doc = typeof document !== 'undefined' ? document : undefined
    if (!doc) return

    const canAdopt =
      typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype

    if (canAdopt) {
      UITheme.removeExistingStyleTag(doc)
      if (!UITheme.adoptedSheet) {
        UITheme.adoptedSheet = new CSSStyleSheet()
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, UITheme.adoptedSheet]
      }
      UITheme.adoptedSheet.replaceSync(css)
    } else {
      if (UITheme.adoptedSheet) {
        UITheme.adoptedSheet = null
      }
      let style = doc.getElementById(UITheme.themeID)
      if (!style) {
        style = doc.createElement('style')
        style.id = UITheme.themeID
        doc.head.appendChild(style)
      }
      style.textContent = css
    }
  }

  /** 内置 light/dark：支持 data-theme 与 prefers-color-scheme */
  static injectBuiltInThemes(light: UITheme, dark: UITheme): void {
    const lightDecls = [
      ...light.themeToDeclarationList(toRaw(light.theme)),
      ...componentCssVarsLightDecls
    ]
    const darkDecls = [
      ...dark.themeToDeclarationList(toRaw(dark.theme)),
      ...componentCssVarsDarkDecls
    ]
    const lightBlock = UITheme.declarationBlock(lightDecls)
    const darkBlock = UITheme.declarationBlock(darkDecls)

    const css = [
      `html { ${lightBlock} }`,
      `@media (prefers-color-scheme: dark) {`,
      `  html:not([data-theme="light"]) { ${darkBlock} }`,
      `}`,
      `html[data-theme="light"] { ${lightBlock} }`,
      `html[data-theme="dark"] { ${darkBlock} }`
    ].join('\n')

    UITheme.applyGlobalCSS(css)
  }

  render(): void {
    const isDark =
      typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
    const componentDecls = isDark ? componentCssVarsDarkDecls : componentCssVarsLightDecls
    const decls = [...this.themeToDeclarationList(toRaw(this.theme)), ...componentDecls]
    const block = UITheme.declarationBlock(decls)
    const css = `html { ${block} }`
    UITheme.applyGlobalCSS(css)
  }

  new(customTheme: RecursivePartial<Theme> = {}): UITheme {
    function delEmpty(obj: Record<string, unknown>) {
      Object.keys(obj).forEach((key) => {
        const value = obj[key]
        if (isObj(value)) {
          return delEmpty(value as Record<string, unknown>)
        }
        if (!value && value !== 0) {
          delete obj[key]
        }
      })
    }

    delEmpty(customTheme as Record<string, unknown>)

    const base = JSON.parse(JSON.stringify(toRaw(this.theme))) as Record<string, any>
    o(base).deepExtend(customTheme as Record<string, any>)
    return new UITheme(base as Theme, { reactive: this.reactiveEnabled })
  }
}
