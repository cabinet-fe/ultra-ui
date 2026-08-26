import { lightTheme } from './light'

export const darkTheme = lightTheme.new(
  {
    color: {
      primary: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
      disabled: '#27272a',
      default: '#27272a'
    },

    bg: {
      color: {
        bottom: '#0c0c0e',
        middle: '#141417',
        top: '#1c1c21',
        hover: '#26262c',
        black: '#000000'
      },
      filter: { blur: 'none', saturate: 'none' }
    },

    'text-color': {
      title: '#f4f4f5',
      main: '#d4d4d8',
      second: '#a1a1aa',
      placeholder: '#71717a',
      assist: '#52525b',
      disabled: '#3f3f46',
      white: '#ffffff'
    },

    border: { color: '#37373f', mutedColor: '#42424c' },

    shadow: {
      color: '#00000066',
      x: 0,
      y: 1,
      blur: 3,
      spread: 0,
      emboss: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
      lg: '0 8px 24px 0 rgba(0, 0, 0, 0.5), 0 2px 6px 0 rgba(0, 0, 0, 0.35)'
    }
  },
  { series: 'dark' }
)
