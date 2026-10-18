import { isObj, str } from '@cat-kit/core'
import { withUnit } from '@veltra/utils'
import { reactive, toRaw, watch } from 'vue'

import {
  componentCssVarsDarkDecls,
  componentCssVarsLightDecls,
  navSurfaceTone,
  resolveNavSidebarDecls,
  type NavSidebarVariant
} from './component-css-vars'
import { hexRgbOnly, hexWithAlpha, isHexColor, mixColor } from './helper'
import type { Theme } from './type'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P]
}

/** 主题系列：浅色或深色。决定组件级 token 与 html[data-theme] */
export type ThemeSeries = 'light' | 'dark'

export interface UIThemeOptions {
  /** 主题变更时是否自动重渲染，默认 true */
  reactive?: boolean
  /** 主题所属系列，默认 'light' */
  series?: ThemeSeries
}

export class UITheme {
  static themeID = 'ultra-ui-theme'

  private static adoptedSheet: CSSStyleSheet | null = null

  readonly theme: Theme

  /** 主题所属系列：浅色 / 深色 */
  series: ThemeSeries

  private readonly reactiveEnabled: boolean

  constructor(theme: Theme, options?: UIThemeOptions) {
    this.reactiveEnabled = options?.reactive !== false
    this.series = options?.series ?? 'light'
    this.theme = reactive(theme) as Theme
    if (this.reactiveEnabled) {
      watch(this.theme, () => this.render(), { deep: true })
    }
  }

  private renderBase(
    theme: Record<string, unknown>,
    themeRules: string[] = [],
    parentKey = '--u'
  ): string[] {
    Object.keys(theme).forEach((key) => {
      // nav 由 navSidebarDecls 按 variant + 覆盖项单独注入（须晚于组件级 token 才生效）
      if (parentKey === '--u' && key === 'nav') return
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
    const alphas = [70]
    const lines: string[] = []
    for (const type of Object.keys(color)) {
      const value = color[type as keyof typeof color]
      // 非 hex 颜色（如 glass 主题的 rgba()）无法推导 alpha token，跳过避免生成 NaN 声明
      if (typeof value !== 'string' || !isHexColor(value)) continue
      const hex = value as `#${string}`
      lines.push(`--u-bg-color-${type}-alpha: ${hex}aa`)
      for (const a of alphas) {
        lines.push(`--u-bg-color-${type}-a-${a}: ${hexWithAlpha(hex, a)}`)
      }
    }
    return lines.join(';')
  }

  /** 语义色 / 边框 / 阴影 / 文本色的 alpha token（替代 color-mix + transparent） */
  private renderAlphaTokens(theme: Theme): string {
    const alphas = [4, 5, 8, 10, 11, 16, 22, 28, 35, 40, 50, 52, 60, 70, 86]
    const lines: string[] = []

    for (const type of Object.keys(theme.color)) {
      const value = theme.color[type as keyof typeof theme.color]
      if (typeof value !== 'string' || !isHexColor(value)) continue
      const hex = value as `#${string}`
      for (const a of alphas) {
        lines.push(`--u-color-${type}-a-${a}: ${hexWithAlpha(hex, a)}`)
      }
    }

    const borderHex = theme.border.color as `#${string}`
    if (isHexColor(borderHex)) {
      for (const a of alphas) {
        lines.push(`--u-border-color-a-${a}: ${hexWithAlpha(borderHex, a)}`)
      }
    }

    const shadowHex = hexRgbOnly(theme.shadow.color)
    // 阴影色非 hex（如 rgba()）时无法推导 alpha token，跳过避免生成 NaN 声明
    if (isHexColor(shadowHex)) {
      for (const a of alphas) {
        lines.push(`--u-shadow-color-a-${a}: ${hexWithAlpha(shadowHex, a)}`)
      }
    }

    const textColor = theme['text-color']
    for (const type of Object.keys(textColor)) {
      const value = textColor[type as keyof typeof textColor]
      if (typeof value === 'string' && isHexColor(value)) {
        const hex = value as `#${string}`
        for (const a of alphas) {
          lines.push(`--u-text-color-${type}-a-${a}: ${hexWithAlpha(hex, a)}`)
        }
      }
    }

    return lines.join(';')
  }

  /** 组件级两色混合 token（batch-edit / kbd） */
  private renderComponentMixTokens(theme: Theme): string {
    const hover = theme.bg.color.hover as `#${string}`
    const top = theme.bg.color.top as `#${string}`
    const black = theme.bg.color.black as `#${string}`
    const borderColor = theme.border.color as `#${string}`
    const shadowColor = hexRgbOnly(theme.shadow.color)

    // 依赖色含非 hex 值（如 glass 主题的 rgba()）时整体跳过，避免生成 NaN 声明；
    // 组件侧 var() fallback 会接管，行为等同于此前的无效声明
    if (![hover, top, black, borderColor].every(isHexColor)) return ''

    const formHeaderBg = mixColor(top, hover, 0.04)

    const kbdInset = mixColor(top, black, 0.25)
    const kbdDropShadow = isHexColor(shadowColor)
      ? hexWithAlpha(shadowColor, 60)
      : 'rgba(0, 0, 0, 0.6)'

    const lines = [
      `--u-batch-edit-form-header-bg: ${formHeaderBg}`,
      `--u-kbd-inset-shadow: ${kbdInset}`,
      `--u-kbd-border-shadow: ${hexWithAlpha(borderColor, 50)}`,
      `--u-kbd-drop-shadow: ${kbdDropShadow}`
    ]

    return lines.join(';')
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
      this.renderAlphaTokens(theme),
      this.renderComponentMixTokens(theme),
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

  /** 主题的默认菜单变体（未声明时为 dark） */
  private navSidebarVariant(theme: Theme): NavSidebarVariant {
    return theme.nav?.variant === 'light' ? 'light' : 'dark'
  }

  /**
   * 主题 nav 覆盖声明：顶层字符串键对所有变体生效；
   * `nav.variants[variant]` 只对该变体生效，追加在最后（同规则后者生效）。
   */
  private navOverrideDecls(theme: Theme, variant: NavSidebarVariant): string[] {
    const nav = theme.nav ?? {}
    const toDecls = (record: Record<string, any> | undefined) =>
      Object.keys(record ?? {})
        .filter((key) => typeof record![key] === 'string' && record![key])
        .map((key) => `--u-nav-${str(key).kebabCase()}: ${record![key]}`)

    const topLevel: Record<string, any> = { ...nav }
    delete topLevel.variant
    delete topLevel.variants

    return [...toDecls(topLevel), ...toDecls(nav.variants?.[variant])]
  }

  /** 指定系列 + 变体的 nav 声明（内置 token + 主题覆盖），供 html 级与容器级注入共用 */
  private navSeriesDecls(theme: Theme, series: ThemeSeries, variant: NavSidebarVariant): string[] {
    return [...resolveNavSidebarDecls(series, variant), ...this.navOverrideDecls(theme, variant)]
  }

  /**
   * nav 侧栏外观声明：默认按主题 `nav.variant` 取内置深/浅侧栏 token，
   * 主题 `nav` 的其余键作为 `--u-nav-*` 覆盖追加在最后（同规则后者生效）。
   * @param variant 显式指定变体（容器级/预览取色用），不传取主题默认变体
   */
  navSidebarDecls(theme: Theme, variant?: NavSidebarVariant): string[] {
    return this.navSeriesDecls(theme, this.series, variant ?? this.navSidebarVariant(theme))
  }

  /**
   * 派生指定菜单变体的主题。变体专属外观由 `nav.variants` 声明，
   * 切换时不再需要手动展开 `navSidebarTokens` 覆盖预设个性色。
   */
  withNavVariant(variant: NavSidebarVariant): UITheme {
    return this.new({ nav: { variant } })
  }

  private static toVariableMap(decls: string[]): Map<string, string> {
    const map = new Map<string, string>()
    for (const decl of decls) {
      const index = decl.indexOf(':')
      if (index < 0) continue
      map.set(decl.slice(0, index).trim(), decl.slice(index + 1).trim())
    }
    return map
  }

  /** 把 token 值里的 `var(--u-*)` 递归解析成具体色值（供主题预览/取色） */
  private static resolveVarValue(value: string, ...maps: Array<Map<string, string>>): string {
    let resolved = value
    // token 引用链通常只有一层（nav → 语义 token），限制次数避免异常数据死循环
    for (let depth = 0; depth < 6 && resolved.includes('var(--u-'); depth += 1) {
      const next = resolved.replace(/var\((--u-[\w-]+)\)/g, (raw, name: string) => {
        for (const map of maps) {
          const hit = map.get(name)
          if (hit !== undefined) return hit
        }
        return raw
      })
      if (next === resolved) break
      resolved = next
    }
    return resolved
  }

  /**
   * 解析当前主题某菜单变体的具体色值（键为去掉 `--u-nav-` 前缀的 token 名，
   * 如 `'bg-color'`、`'active-color'`、`'surface-hairline'`）。
   * 用于主题选择器预览等「主题未加载到 DOM 也要取色」的场景。
   */
  navSidebarColors(variant?: NavSidebarVariant): Record<string, string> {
    const raw = toRaw(this.theme) as Theme
    const target = variant ?? this.navSidebarVariant(raw)
    const themeVars = UITheme.toVariableMap(this.themeToDeclarationList(raw))
    const navVars = UITheme.toVariableMap(this.navSeriesDecls(raw, this.series, target))
    const colors: Record<string, string> = {}
    for (const [name, value] of navVars) {
      colors[name.replace(/^--u-nav-/, '')] = UITheme.resolveVarValue(value, themeVars, navVars)
    }
    return colors
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

  /**
   * 注入主题：全局 token + 与主题系列匹配的组件级 token + nav 侧栏外观，写入 html[data-theme]；
   * 同时注入容器级菜单变体规则（`[data-nav-variant]`）与实际底色色调 `html[data-nav-surface]`。
   */
  render(): void {
    const componentDecls =
      this.series === 'dark' ? componentCssVarsDarkDecls : componentCssVarsLightDecls
    const raw = toRaw(this.theme)
    const activeVariant = this.navSidebarVariant(raw)
    const decls = [
      ...this.themeToDeclarationList(raw),
      ...componentDecls,
      ...this.navSeriesDecls(raw, this.series, activeVariant)
    ]
    const block = UITheme.declarationBlock(decls)
    // 容器级变体：同一主题下任意子树加 data-nav-variant 即可切换菜单深浅，无需重建主题
    const variantRules = (['light', 'dark'] as const).flatMap((series) =>
      (['dark', 'light'] as const).map((variant) => {
        const variantBlock = UITheme.declarationBlock(this.navSeriesDecls(raw, series, variant))
        return `html[data-theme="${series}"] [data-nav-variant="${variant}"] { ${variantBlock} }`
      })
    )
    UITheme.applyGlobalCSS([`html { ${block} }`, ...variantRules].join('\n'))
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = this.series
      document.documentElement.dataset.navSurface = navSurfaceTone(this.series, activeVariant)
    }
  }

  new(customTheme: RecursivePartial<Theme> = {}, options?: { series?: ThemeSeries }): UITheme {
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

    function deepMerge(target: any, source: any) {
      if (typeof source !== 'object' || source === null) return
      Object.keys(source).forEach((key) => {
        const sourceVal = source[key]
        if (typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)) {
          if (typeof target[key] !== 'object' || target[key] === null) {
            target[key] = {}
          }
          deepMerge(target[key], sourceVal)
        } else {
          target[key] = sourceVal
        }
      })
    }

    deepMerge(base, customTheme)
    return new UITheme(base as Theme, {
      reactive: this.reactiveEnabled,
      series: options?.series ?? this.series
    })
  }
}
