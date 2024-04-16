import '@ui/styles'
import { CLS_PREFIX } from '@ui/shared'

// 设置颜色类别的派生色, 分别和黑色和白色混合
const computedStyles = getComputedStyle(document.documentElement)

type ColorType = 'text-color' | 'bg-color' | 'color'

/**
 * 获取颜色的变量值列表
 * @param type 颜色类型
 * @param names 颜色名称
 * @returns
 */
function getColorVars(type: ColorType, names: string[]) {
  return names.map(name => ({
    name,
    color: computedStyles
      .getPropertyValue(`--u-${type}-${name}`)
      .trim() as `#${string}`
  }))
}

const colors = getColorVars('color', [
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'default'
])

type ColorRGB = [number, number, number]

/** 十六进制转RGB */
const HEXToRGB = (color: `#${string}`): ColorRGB => {
  let hex = color.slice(1)
  const RGB: ColorRGB = [0, 0, 0]
  if (hex.length === 3) {
    let i = 0
    while (i < hex.length) {
      RGB[i] = parseInt(hex[i]!.repeat(2), 16)
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

/**
 * 混合两个颜色，并返回混合结果的十六进制表示。
 * @param color1 - 第一个颜色，格式为`#RRGGBB`。
 * @param color2 - 第二个颜色，格式为`#RRGGBB`。
 * @param ratio - 颜色混合的比例，取值范围为0到1。
 * @returns 混合结果的十六进制表示。
 */
function mixColor(color1: `#${string}`, color2: `#${string}`, ratio: number) {
  if (ratio > 1) throw new Error('ratio的值在0-1之间')
  const color1RGB = HEXToRGB(color1)
  const color2RGB = HEXToRGB(color2)

  const color1Ratio = 1 - ratio

  return (
    '#' +
    color1RGB
      .map((n, i) => {
        const hex = Math.floor(
          color1Ratio * n + color2RGB[i]! * ratio
        ).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

const colorMixedType: `${'light' | 'dark'}-${number}`[] = [
  'light-1',
  'light-3',
  'light-7',
  'light-9',
  'dark-1',
  'dark-3',
  'dark-7',
  'dark-9'
]

const styleID = 'theme-style'
const originStyleEle = document.getElementById(styleID)
if (originStyleEle) {
  document.head.removeChild(originStyleEle)
}

const styleEle = document.createElement('style')
styleEle.id = styleID

const colorVars = colors
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

const bgColorVars = getColorVars('bg-color', ['top', 'middle', 'bottom'])
  .map(item => {
    const { name, color } = item
    return `--${CLS_PREFIX}bg-color-${name}-alpha: ${color}cc`
  })
  .join(';')

styleEle.innerText = `:root {${colorVars}; ${bgColorVars};`

document.head.append(styleEle)
