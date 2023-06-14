import '@ui/styles'
import { CLS_PREFIX } from '@ui/shared'

type ColorTypes = 'primary' | 'info' | 'success' | 'warning' | 'danger'

// 设置颜色类别的派生色, 分别和黑色和白色混合
const computedStyles = getComputedStyle(document.documentElement)

function getColorVars(names: ColorTypes[]) {
  return names.map(name => ({
    name,
    color: computedStyles
      .getPropertyValue(`--u-color-${name}`)
      .trim() as `#${string}`
  }))
}

const colors = getColorVars(['primary', 'success', 'warning', 'danger', 'info'])

type ColorRGB = [number, number, number]

const HEXToRGB = (color: `#${string}`): ColorRGB => {
  let hex = color.slice(1)
  const RGB: ColorRGB = [0, 0, 0]
  if (hex.length === 3) {
    let i = 0
    while (i < hex.length) {
      RGB[i] = parseInt(hex[i].repeat(2), 16)
      i++
    }
    return RGB
  }

  if (hex.length === 6) {
    let i = 0
    while (i < hex.length) {
      RGB[i / 2] = parseInt(hex.slice(i, i + 2), 16)
      i += 2
    }
    return RGB
  }

  return RGB
}

function mixColor(color1: `#${string}`, color2: `#${string}`, ratio: number) {
  if (ratio > 1) throw new Error('ratio的值在0-1之间')
  const color1RGB = HEXToRGB(color1)
  const color2RGB = HEXToRGB(color2)

  const color1Ratio = 1 - ratio

  return (
    '#' +
    color1RGB
      .map((n, i) => {
        return Math.floor(color1Ratio * n + color2RGB[i]! * ratio).toString(16)
      })
      .join('')
  )
}

const colorMixedType: `${'light' | 'dark'}-${number}`[] = [
  'light-1',
  'light-3',
  'dark-1',
  'dark-3'
]

const styleID = 'theme-style'
const originStyleEle = document.getElementById(styleID)
if (originStyleEle) {
  document.head.removeChild(originStyleEle)
}

const styleEle = document.createElement('style')
styleEle.id = styleID

const vars = colors
  .map(({ name, color }) => {
    // 多类型混合
    return colorMixedType
      .map(type => {
        const [colorStyle, ratio] = type.split('-') as [
          'light' | 'dark',
          number
        ]

        return `--${CLS_PREFIX}color-${name}-${type}: ${mixColor(
          color,
          colorStyle === 'dark' ? '#000' : '#fff',
          ratio / 10
        )}`
      })
      .join(';')
  })
  .join(';')

styleEle.innerText = `:root {${vars}}`

document.head.append(styleEle)
