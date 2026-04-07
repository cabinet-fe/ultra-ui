import { isObj, o, str } from '@cat-kit/core'
import { mixColor } from '../helper'
import type { Theme } from '../type'
import { withUnit } from '@ultra-ui/core'
import { reactive, toRaw, watch } from 'vue'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P]
}

export class UITheme {
  static themeID = 'ultra-ui-theme'

  readonly theme: Theme

  constructor(theme: Theme) {
    this.theme = reactive(theme)
    watch(this.theme, () => this.render(), { deep: true })
  }

  private renderBase(
    theme: Record<string, any>,
    themeRules: string[] = [],
    parentKey = '-'
  ) {
    Object.keys(theme).forEach(key => {
      const value = theme[key]
      const varKey = `${parentKey.startsWith('-') ? parentKey : str(parentKey).kebabCase()}-${str(key).kebabCase()}`
      if (typeof value === 'object') {
        this.renderBase(value, themeRules, varKey)
      } else {
        if (value || value === 0) {
          themeRules.push(`${varKey}: ${withUnit(value, 'px')}`)
        }
      }
    })

    return themeRules.join(';')
  }

  /** 边框 */
  private renderBorder() {
    const border = Object.keys(this.theme.border)
      .map(key => `var(--border-${key})`)
      .join(' ')

    return `--border: ${border}`
  }

  private renderTypeColor() {
    const { color } = this.theme

    const types = Object.keys(color) as (keyof typeof color)[]
    const rates = [1, 3, 5, 7, 9]

    const varsText = types
      .map(type => {
        let colorValue = color[type] as `#${string}`

        const rateColors = rates
          .map(rate => {
            const light = `--color-${type}-light-${rate}: ${mixColor(
              colorValue,
              '#fff',
              rate / 10
            )}`
            const dark = `--color-${type}-dark-${rate}: ${mixColor(
              colorValue,
              '#000',
              rate / 10
            )}`
            return `${light};${dark}`
          })
          .join(';')

        return rateColors
      })
      .join(';')

    return varsText
  }

  private renderShadow() {
    const shadow = ['x', 'y', 'blur', 'spread', 'color']
      .map(k => `var(--shadow-${k})`)
      .join(' ')

    return `--shadow: ${shadow}`
  }

  private renderBGColorAlpha() {
    const { color } = this.theme.bg
    const bgs = Object.keys(color) as (keyof typeof color)[]
    return bgs
      .map(type => `--bg-color-${String(type)}-alpha: ${color[type]}aa`)
      .join(';')
  }

  private renderBGFilter() {
    const { filter } = this.theme.bg
    return `--bg-filter: ${filter.blur} ${filter.saturate}`
  }

  render(): void {
    const ruleText = [
      this.renderBase(this.theme),
      this.renderTypeColor(),
      this.renderBorder(),
      this.renderShadow(),
      this.renderBGColorAlpha(),
      this.renderBGFilter()
    ].join(';')

    const _document = typeof document !== 'undefined' ? document : undefined

    if (!_document) return

    let style = _document.getElementById(UITheme.themeID)
    if (!style) {
      style = _document.createElement('style')
      style.id = UITheme.themeID
      style.innerText = `:root { ${ruleText}; }`
      _document.head.appendChild(style)
    } else {
      style.innerText = `:root { ${ruleText}; }`
    }
  }

  new(customTheme: RecursivePartial<Theme> = {}): UITheme {
    function delEmpty(obj: Record<string, any>) {
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        if (isObj(value)) {
          return delEmpty(value)
        }
        if (!value && value !== 0) {
          delete obj[key]
        }
      })
    }

    delEmpty(customTheme)

    const themeConfig = o(
      JSON.parse(JSON.stringify(toRaw(this.theme))) as Record<string, unknown>
    ).merge(customTheme as Record<string, unknown>) as Theme
    return new UITheme(themeConfig)
  }
}
