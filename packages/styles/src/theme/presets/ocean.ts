import { lightTheme } from './light'

/** 海盐（松石青 + 冷白底），天生适合浅色 */
export const oceanTheme = lightTheme.new({
  color: {
    primary: '#0d9488', // 松石青
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
    disabled: '#eff6f5',
    default: '#eff6f5'
  },
  bg: { color: { bottom: '#eef6f5', middle: '#f5fafa', top: '#ffffff', hover: '#e0efee' } },
  'text-color': {
    title: '#16302e', // 深礁
    main: '#2f4a48',
    second: '#62807d',
    assist: '#c3d6d4',
    placeholder: '#9eb6b4',
    disabled: '#9eb6b4'
  },
  border: { width: 1, color: '#d3e5e3', mutedColor: '#bad6d3' },
  radius: { small: 6, default: 10, large: 14 },
  shadow: { color: 'rgba(21, 94, 89, 0.12)', x: 0, y: 2, blur: 10, spread: -1 }
})
