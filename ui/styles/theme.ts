import { reactive, watchEffect } from 'vue'
import type { Theme } from './type'
import { mixColor } from './helper'
import { kebabCase } from 'cat-kit/fe'
import { withUnit } from '@ui/utils'

function defineBySize(variable: Record<'small' | 'default' | 'large', number>) {
  return variable
}

export const theme = reactive<Theme>({
  color: {
    primary: '#0ea5e9',
    success: '#4caf50',
    warning: '#ffc107',
    danger: '#f44336',
    info: '#009688',
    disabled: '#f5f7fa',
    default: '#f1f5f9'
  },

  bgColor: {
    bottom: '#fdfdfd',
    middle: '#fefefe',
    top: '#ffffff',
    hover: '#f5f7fa',
    black: '#000000'
  },

  border: {
    color: '#dcdfe6',
    width: 1,
    style: 'solid'
  },

  textColor: {
    title: '#303133',
    main: '#606266',
    placeholder: '#a8abb2',
    second: '#979797',
    assist: '#c0c4cc',
    disabled: '#a8abb2',
    white: '#fff'
  },

  radius: defineBySize({
    small: 2,
    default: 4,
    large: 8
  }),

  formComponentHeight: defineBySize({
    small: 24,
    default: 32,
    large: 40
  }),

  menuHeight: defineBySize({
    small: 32,
    default: 40,
    large: 48
  }),

  fontFamily:
    'Inter, "Roboto", "Segoe UI", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", "PingFang SC", sans-serif',

  fontSizeTitle: defineBySize({
    small: 16,
    default: 16,
    large: 18
  }),

  fontSizeMain: defineBySize({
    small: 12,
    default: 14,
    large: 16
  }),

  fontSizeAssist: defineBySize({
    small: 12,
    default: 12,
    large: 14
  }),

  shadow: {
    color: '#ccc',
    x: 0,
    y: 0,
    blur: 4,
    spread: 0
  },

  tag: defineBySize({
    small: 20,
    default: 24,
    large: 28
  }),

  gap: defineBySize({
    small: 6,
    default: 8,
    large: 12
  }),

  breakpoint: {
    xs: 600,
    sm: 960,
    md: 1280,
    lg: 1920
  }
})

function renderThemeColor(color: Theme['color']) {
  const types = Object.keys(color) as (keyof Theme['color'])[]
  const rates = [1, 3, 5, 7, 9]

  const varsText = types
    .map(type => {
      let colorKey = `--color-${type}`
      let colorValue = color[type]! as `#${string}`

      const rateColors = rates
        .map(rate => {
          const light = `${colorKey}-light-${rate}: ${mixColor(
            colorValue,
            '#fff',
            rate / 10
          )}`
          const dark = `${colorKey}-dark-${rate}: ${mixColor(
            colorValue,
            '#000',
            rate / 10
          )}`
          return `${light};${dark}`
        })
        .join(';')

      return `${colorKey}: ${colorValue};${rateColors}`
    })
    .join(';')

  return varsText
}

function renderOtherTheme(
  theme: Record<string, any>,
  themeRules: string[] = [],
  parentKey = '-'
) {
  Object.keys(theme).forEach(key => {
    const value = theme[key]
    const varKey = `${parentKey.startsWith('-') ? parentKey : kebabCase(parentKey)}-${kebabCase(key)}`
    if (typeof value === 'object') {
      renderOtherTheme(value, themeRules, varKey)
    } else {
      themeRules.push(`${varKey}: ${withUnit(value, 'px')}`)
    }
  })

  return themeRules.join(';')
}

function renderShadow() {
  const k = (v: string) => `var(--shadow-${v})`
  return `--shadow: ${k('x')} ${k('y')} ${k('blur')} ${k('spread')} ${k('color')}`
}

function renderBorder() {
  const k = (v: string) => `var(--border-${v})`
  return `--border:${k('width')} ${k('style')} ${k('color')}`
}

function renderBGColorAlpha() {
  const bgs = Object.keys(theme.bgColor)
  return bgs
    .map(type => {
      return `--bg-color-${type}-alpha: ${theme.bgColor[type]}cc`
    })
    .join(';')
}

/** 加载主题 */
function loadTheme() {
  // 主题色
  const { color, ...rest } = theme

  const ruleText = [
    renderThemeColor(color),
    renderOtherTheme(rest),
    renderShadow(),
    renderBorder(),
    renderBGColorAlpha()
  ].join(';')

  const themeID = 'ultra-ui-theme'

  let style = document.getElementById(themeID)
  if (!style) {
    style = document.createElement('style')
    style.id = themeID
    style.innerText = `:root { ${ruleText}; }`
    document.head.appendChild(style)
  } else {
    style.innerText = `:root { ${ruleText}; }`
  }
}

watchEffect(() => {
  loadTheme()
})
