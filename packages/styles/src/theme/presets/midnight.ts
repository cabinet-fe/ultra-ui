import { darkTheme } from './dark'

/** 午夜（靛蓝 + 深空底，宽松间距、舒缓缓动），天生适合深色 */
export const midnightTheme = darkTheme.new({
  color: {
    primary: '#6f78ee', // 星靛（白字对比 3.75:1）
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
    placeholder: '#7d8ab8',
    assist: '#5b6895',
    disabled: '#576493'
  },
  // mutedColor 与卡片底对比 2.6:1，保证输入控件清晰可见
  border: { color: '#36457a', mutedColor: '#52619a' },
  // 更宽松的间距，配合深空的呼吸感
  gap: { small: 8, default: 10, large: 14 },
  shadow: {
    color: '#00000080',
    x: 0,
    y: 2,
    blur: 8,
    spread: 0,
    emboss: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.6), 0 2px 6px 0 rgba(0, 0, 0, 0.4)'
  },
  transition: { slow: '0.4s', ease: 'cubic-bezier(0.33, 1, 0.68, 1)' }
})
