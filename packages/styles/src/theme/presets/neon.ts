import { darkTheme } from './dark'

/** 霓虹（品红 + 夜紫底 + 辉光阴影，小圆角），天生适合深色 */
export const neonTheme = darkTheme.new({
  color: {
    primary: '#c026d3', // 霓红
    success: '#4ade80',
    warning: '#facc15',
    danger: '#fb7185',
    info: '#22d3ee',
    disabled: '#241532',
    default: '#241532'
  },
  bg: {
    color: {
      bottom: '#0c0612', // 夜紫
      middle: '#130a1d',
      top: '#1c102a',
      hover: '#28163d'
    }
  },
  'text-color': {
    title: '#f6efff',
    main: '#d9cdee',
    second: '#a08bc4',
    placeholder: '#6f5a93',
    assist: '#553f78',
    disabled: '#553f78'
  },
  border: { color: '#3b2358', mutedColor: '#2c1843' },
  // 赛博感：小圆角 + 品红辉光
  radius: { small: 2, default: 4, large: 8 },
  shadow: {
    color: 'rgba(192, 38, 211, 0.3)',
    x: 0,
    y: 0,
    blur: 12,
    spread: 0,
    emboss: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    lg: '0 0 24px 0 rgba(192, 38, 211, 0.25), 0 8px 24px 0 rgba(0, 0, 0, 0.5)'
  }
})
