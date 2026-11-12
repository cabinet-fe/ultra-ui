import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 国潮（绛红 + 鎏金线 + 绢帛米底，宫墙深红侧栏），天生适合浅色 */
export const guochaoTheme = lightTheme.new({
  color: {
    primary: '#C2332D', // 绛红
    success: '#3B7F5E', // 竹青
    warning: '#C77E15', // 琥珀金
    danger: '#A62639', // 枣红（胭脂深，与绛红拉开明度差）
    info: '#3568A8', // 青花蓝
    disabled: '#F5EEE3',
    default: '#F5EEE3'
  },
  bg: { color: { bottom: '#F4EDDF', middle: '#FAF5EA', top: '#FFFDF6', hover: '#EFE7D5' } },
  'text-color': {
    title: '#2C2018', // 玄墨
    main: '#49382C',
    second: '#7E6A58',
    assist: '#CBB69C',
    placeholder: '#826C52',
    disabled: '#9A8672'
  },
  border: { width: 1, color: '#E6DAC2', mutedColor: '#B09B6F' }, // 淡金线 / 鎏金描边
  radius: { small: 6, default: 10, large: 14 },
  shadow: {
    color: 'rgba(124, 44, 26, 0.13)',
    x: 0,
    y: 3,
    blur: 12,
    spread: -2,
    sm: '0 1px 2px 0 rgba(124, 44, 26, 0.10)',
    lg: '0 8px 24px 0 rgba(124, 44, 26, 0.15), 0 2px 6px 0 rgba(124, 44, 26, 0.08)'
  },
  nav: {
    // 宫墙深红侧栏（深变体）：玄墨 + 绛红调和；浅变体回落到绢帛米底（bg middle）
    variants: { dark: { 'bg-color': mixColor('#2C2018', '#C2332D', 0.3) } }
  }
})
