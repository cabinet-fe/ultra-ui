import { lightTheme } from './light'

/** 樱花（柔粉 + 花瓣底，大圆角、弹性缓动），天生适合浅色 */
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
    second: '#92616d',
    assist: '#dcc0c7',
    placeholder: '#b58694',
    disabled: '#c4a0aa'
  },
  border: { width: 1, color: '#f0c3d4', mutedColor: '#e09db6' },
  radius: { small: 8, default: 12, large: 16 },
  // 更宽松的表单控件，配合大圆角的柔和感
  'form-component-height': { small: 26, default: 34, large: 42 },
  shadow: {
    color: 'rgba(173, 58, 105, 0.12)',
    x: 0,
    y: 4,
    blur: 14,
    spread: -2,
    sm: '0 1px 2px 0 rgba(173, 58, 105, 0.08)',
    lg: '0 8px 24px 0 rgba(173, 58, 105, 0.14), 0 2px 6px 0 rgba(173, 58, 105, 0.08)'
  },
  transition: { easeOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
})
