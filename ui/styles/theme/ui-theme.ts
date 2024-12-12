import { kebabCase, merge } from 'cat-kit/fe'
import { mixColor } from '../helper'
import type { Theme } from '../type'
import { withUnit } from '@ui/utils'
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
      const varKey = `${parentKey.startsWith('-') ? parentKey : kebabCase(parentKey)}-${kebabCase(key)}`
      if (typeof value === 'object') {
        this.renderBase(value, themeRules, varKey)
      } else {
        themeRules.push(`${varKey}: ${withUnit(value, 'px')}`)
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

    const types = Object.keys(color)
    const rates = [1, 3, 5, 7, 9]

    const varsText = types
      .map(type => {
        let colorValue = color[type]! as `#${string}`

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
    const { bgColor } = this.theme
    const bgs = Object.keys(bgColor)
    return bgs
      .map(type => `--bg-color-${type}-alpha: ${bgColor[type]}aa`)
      .join(';')
  }

  private renderBGFilter() {
    const { bgFilter } = this.theme
    return `--bg-filter: ${bgFilter.blur} ${bgFilter.saturate}`
  }

  render() {
    const ruleText = [
      this.renderBase(this.theme),
      this.renderTypeColor(),
      this.renderBorder(),
      this.renderShadow(),
      this.renderBGColorAlpha(),
      this.renderBGFilter()
    ].join(';')

    let style = document.getElementById(UITheme.themeID)
    if (!style) {
      style = document.createElement('style')
      style.id = UITheme.themeID
      style.innerText = `:root { ${ruleText}; }`
      document.head.appendChild(style)
    } else {
      style.innerText = `:root { ${ruleText}; }`
    }
  }

  new(customTheme: RecursivePartial<Theme> = {}) {
    const themeConfig = merge(
      JSON.parse(JSON.stringify(toRaw(this.theme))),
      customTheme
    )
    return new UITheme(themeConfig)
  }
}
