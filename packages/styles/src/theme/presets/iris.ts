import { lightTheme } from './light'

/** 鸢尾（微紫云雾底 + 电光鸢尾紫 + 双层内高光软立体浮雕，浅色侧栏），天生适合浅色 */
export const irisTheme = lightTheme.new({
  color: {
    primary: '#635BFF', // 电光鸢尾紫
    success: '#10A37F', // 翡翠绿
    warning: '#F59E0B', // 琥珀黄
    danger: '#E5484D', // 玫瑰红
    info: '#0070F3', // 电光蓝
    disabled: '#EFEFF8',
    default: '#EFEFF8'
  },
  bg: {
    color: {
      bottom: '#EFEFF8', // 云雾紫白
      middle: '#F6F6FC',
      top: '#FFFFFF',
      hover: '#E6E6F4'
    }
  },
  'text-color': {
    title: '#181430',
    main: '#2E2A4A',
    second: '#656080',
    placeholder: '#8E89A8',
    assist: '#C5C2DC',
    disabled: '#9E9AB8'
  },
  border: { width: 1, color: '#E2E1F0', mutedColor: '#C9C7E0' },
  radius: { small: 8, default: 12, large: 16 },
  shadow: {
    color: 'rgba(24, 20, 72, 0.08)',
    x: 0,
    y: 4,
    blur: 14,
    spread: 0,
    emboss:
      '0 1px 2px 0 rgba(24, 20, 72, 0.06), inset 0 1px 0 0 #FFFFFF, inset 0 -1px 0 0 rgba(24, 20, 72, 0.06)',
    sm: '0 1px 3px 0 rgba(24, 20, 72, 0.06)',
    lg: '0 10px 28px -2px rgba(24, 20, 72, 0.14), 0 2px 6px 0 rgba(24, 20, 72, 0.06)'
  },
  button: { 'default-bg': '#FFFFFF' },
  // 现代 SaaS 浅色侧栏（演示浅色变体）
  nav: { variant: 'light' }
})
