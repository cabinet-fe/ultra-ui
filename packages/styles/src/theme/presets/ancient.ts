import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 古风（松烟绿 + 宣纸底），天生适合浅色 */
export const ancientTheme = lightTheme.new({
  color: {
    primary: '#3d6b58' // 松烟绿
  },
  bg: {
    color: {
      bottom: '#f1ede0', // 宣纸底
      middle: '#f7f4ea',
      top: '#fdfbf4',
      hover: '#e9e2cf'
    }
  },
  'text-color': {
    title: '#2b2a26', // 黛墨
    main: '#403c34',
    second: '#7a7264',
    assist: '#a89f8c',
    placeholder: '#a89f8c'
  },
  border: { width: 1, color: '#e4dcc8', mutedColor: '#d2c8ac' },
  radius: { small: 4, default: 8, large: 12 },
  shadow: { color: 'rgba(64, 54, 32, 0.14)', x: 0, y: 4, blur: 16, spread: -2 },
  nav: {
    // 松烟墨侧栏：黛墨 + 松烟绿调和
    'bg-color': mixColor('#2b2a26', '#3d6b58', 0.28)
  }
})
