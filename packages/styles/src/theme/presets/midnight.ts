import { darkTheme } from './dark'

/** 午夜（靛蓝 + 深空底），天生适合深色 */
export const midnightTheme = darkTheme.new({
  color: {
    primary: '#818cf8', // 星靛
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
    disabled: '#232d4a',
    default: '#232d4a'
  },
  bg: {
    color: {
      bottom: '#0a0f1e', // 深空
      middle: '#101731',
      top: '#182242',
      hover: '#212d54'
    }
  },
  'text-color': {
    title: '#e8ecff', // 月光
    main: '#c3cbf0',
    second: '#8d97c6',
    placeholder: '#5f6a94',
    assist: '#4a547a',
    disabled: '#46507a'
  },
  border: { color: '#2a365c', mutedColor: '#202a49' },
  shadow: {
    color: '#00000080',
    x: 0,
    y: 2,
    blur: 8,
    spread: 0,
    emboss: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.6), 0 2px 6px 0 rgba(0, 0, 0, 0.4)'
  }
})
