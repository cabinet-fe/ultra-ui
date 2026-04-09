import { lightTheme } from './light'

export const darkTheme = lightTheme.new({
  color: {
    primary: '#4f8ff7',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#13c2c2',
    disabled: '#212020',
    default: '#595959'
  },

  bg: {
    color: {
      bottom: '#0f0f0f',
      middle: '#1a1a1a',
      top: '#262626',
      hover: '#303030',
      black: '#000000'
    },
    filter: { blur: 'blur(16px)', saturate: 'saturate(180%)' }
  },

  'text-color': {
    title: '#f0f0f0',
    main: '#d9d9d9',
    second: '#a6a6a6',
    placeholder: '#737373',
    assist: '#595959',
    disabled: '#434343',
    white: '#ffffff'
  },

  border: { color: '#404040' },

  shadow: { color: 'rgba(255, 255, 255, 0.2)', x: 0, y: 2, blur: 8, spread: 0 }
})
