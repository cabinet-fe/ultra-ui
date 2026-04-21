# 主题 TypeScript API（UITheme / loadTheme / helper）

```typescript
import { isObj, o, str } from '@cat-kit/core'
import { withUnit } from '@veltra/utils'
import { reactive, toRaw, watch } from 'vue'

import { componentCssVarsDarkDecls, componentCssVarsLightDecls } from './component-css-vars'
import { mixColor } from './helper'
import type { Theme } from './type'

type RecursivePartial<T> = { [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P] }

function isDevEnv(): boolean {
  try {
    if (typeof import.meta !== 'undefined') {
      const env = (import.meta as { env?: { DEV?: boolean } }).env
      if (env?.DEV === true) return true
    }
  } catch {
    /* ignore */
  }
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  return typeof proc !== 'undefined' && proc.env?.NODE_ENV !== 'production'
}

export class UITheme {
  static themeID = 'ultra-ui-theme'

  private static legacyDeprecationWarned = false

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
    const border = Object.keys(theme.border)
      .map((key) => `var(--u-border-${key})`)
      .join(' ')

    return `--u-border: ${border}`
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
    return `--u-bg-filter: ${filter.blur} ${filter.saturate}`
  }

  /** 主题变量声明（不含 legacy 副本） */
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

  private static withLegacyDuplicates(decls: string[]): string {
    const legacy: string[] = []
    for (const decl of decls) {
      const idx = decl.indexOf(':')
      if (idx === -1) continue
      const name = decl.slice(0, idx).trim()
      const value = decl.slice(idx + 1).trim()
      if (name.startsWith('--u-')) {
        legacy.push(`--${name.slice(4)}: ${value}`)
      }
    }
    return [...decls, ...legacy].join(';')
  }

  private static warnLegacyOnce(): void {
    if (!isDevEnv() || UITheme.legacyDeprecationWarned) return
    UITheme.legacyDeprecationWarned = true
    console.warn(
      '[@veltra/styles] Theme CSS variables now prefer the `--u-` namespace. ' +
        'Unprefixed aliases (e.g. `--color-primary`) are deprecated and will be removed in a future major version.'
    )
  }

  private static declarationBlock(decls: string[]): string {
    const merged = UITheme.withLegacyDuplicates(decls)
    UITheme.warnLegacyOnce()
    return merged
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
    const decls = [...this.themeToDeclarationList(toRaw(this.theme)), ...componentCssVarsLightDecls]
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
```

---

```typescript
import { useConfig } from '@veltra/compositions'
import { shallowRef, type ShallowRef } from 'vue'

import { darkTheme } from './theme/dark'
import { lightTheme } from './theme/light'
import { UITheme } from './theme/ui-theme'

export const currentTheme: ShallowRef<UITheme | undefined> = shallowRef<UITheme>()

export function setTheme(mode: 'light' | 'dark' | 'auto'): void {
  UITheme.setTheme(mode)
}

/**
 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是 main.ts)或其他全局环境中调用。
 *
 * 不传 `theme` 时注入内置 light/dark 变量（支持 `setTheme` 与系统暗色偏好）。
 * 传入自定义 `UITheme` 时使用单次 `html { }` 注入。
 */
export function loadTheme(theme?: UITheme): void {
  currentTheme.value = theme ?? lightTheme

  const { config } = useConfig()
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add(config.size)
  }

  if (typeof document === 'undefined') return

  if (!theme) {
    currentTheme.value = lightTheme
    UITheme.injectBuiltInThemes(lightTheme, darkTheme)
    return
  }

  currentTheme.value = theme

  if (theme === lightTheme || theme === darkTheme) {
    UITheme.injectBuiltInThemes(lightTheme, darkTheme)
    UITheme.setTheme(theme === darkTheme ? 'dark' : 'light')
  } else {
    theme.render()
  }
}
```

---

```typescript
import type { RGBColor } from './type'

/** 实现十六进制颜色转RGB颜色，包括透明度 */
export function HEXToRGB(color: string): RGBColor {
  // 移除可能存在的 '#' 前缀
  let hex = color.replace(/^#/, '')
  let [r, g, b] = [0, 0, 0]

  if (hex.length === 3) {
    const [r10, g10, b10] = [hex[0]!, hex[1]!, hex[2]!]
    hex = `${r10}${r10}${g10}${g10}${b10}${b10}`
  }

  r = parseInt(hex.slice(0, 2), 16)
  g = parseInt(hex.slice(2, 4), 16)
  b = parseInt(hex.slice(4, 6), 16)

  return [r, g, b]
}

/**
 * 混合两个颜色，并返回混合结果的十六进制表示。
 * @param color1 - 第一个颜色，格式为`#RRGGBB`。
 * @param color2 - 第二个颜色，格式为`#RRGGBB`。
 * @param ratio - 颜色混合的比例，取值范围为0到1。
 * @returns 混合结果的十六进制表示。
 */
export function mixColor(color1: `#${string}`, color2: `#${string}`, ratio: number): string {
  if (ratio > 1) throw new Error('ratio的值在0-1之间')
  const color1RGB = HEXToRGB(color1)
  const color2RGB = HEXToRGB(color2)

  const color1Ratio = 1 - ratio

  return (
    '#' +
    color1RGB
      .map((n, i) => {
        const hex = Math.floor(color1Ratio * n + color2RGB[i]! * ratio).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export function defineBySize(
  variable: Record<'small' | 'default' | 'large', number>
): Record<'small' | 'default' | 'large', number> {
  return variable
}

/**
 * 引用全局主题 CSS 变量（`--u-*` 命名空间）
 * @param prop - 与 Theme 结构对应的连字符路径，如 `text-color-title`、`bg-color-hover`
 */
export function cssVar(prop: string): string {
  return `var(--u-${prop})`
}
```
