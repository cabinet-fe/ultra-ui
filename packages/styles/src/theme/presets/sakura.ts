import { lightTheme } from './light'

/** 樱花（柔粉 + 花瓣底），天生适合浅色 */
export const sakuraTheme = lightTheme.new({
  color: {
    primary: '#e64980', // 樱粉
    success: '#2f9e6e',
    warning: '#e8890c',
    danger: '#e03131',
    info: '#7c6cf0',
    disabled: '#faf0f3',
    default: '#faf0f3'
  },
  bg: { color: { bottom: '#fdf1f5', middle: '#fef6f9', top: '#ffffff', hover: '#fbe4ec' } },
  'text-color': {
    title: '#43272f', // 樱墨
    main: '#5f3d46',
    second: '#9a6b76',
    assist: '#dcc0c7',
    placeholder: '#c9a3ac',
    disabled: '#c9a3ac'
  },
  border: { width: 1, color: '#f5d3e0', mutedColor: '#efbdd0' },
  radius: { small: 8, default: 12, large: 16 },
  shadow: { color: 'rgba(173, 58, 105, 0.12)', x: 0, y: 4, blur: 14, spread: -2 }
})
