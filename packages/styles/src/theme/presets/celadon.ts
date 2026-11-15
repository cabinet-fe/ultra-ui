import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 天青（汝窑青釉 + 天青雾白底 + 瓷釉高光浮雕，深黛青侧栏），天生适合浅色 */
export const celadonTheme = lightTheme.new({
  color: {
    primary: '#2B7A78', // 汝窑青
    success: '#2E8B57', // 松石绿
    warning: '#C87D20', // 藤黄
    danger: '#C94A4A', // 胭脂红
    info: '#3A7CA5', // 霁蓝
    disabled: '#E6EFEF',
    default: '#E6EFEF'
  },
  bg: {
    color: {
      bottom: '#E6EFEF', // 天青雾白
      middle: '#F0F6F6',
      top: '#F9FCFC',
      hover: '#DCE8E8'
    }
  },
  'text-color': {
    title: '#182628', // 深黛墨
    main: '#2D3E40',
    second: '#5C7375',
    placeholder: '#7D9698',
    assist: '#B5C9CA',
    disabled: '#8FA6A8'
  },
  border: { width: 1, color: '#D0E0E0', mutedColor: '#A8C2C2' },
  radius: { small: 6, default: 10, large: 14 },
  shadow: {
    color: 'rgba(24, 62, 64, 0.12)',
    x: 0,
    y: 3,
    blur: 12,
    spread: -2,
    emboss: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 1px 3px 0 rgba(24, 62, 64, 0.08)',
    sm: '0 1px 2px 0 rgba(24, 62, 64, 0.08)',
    lg: '0 8px 24px -2px rgba(24, 62, 64, 0.14), 0 2px 6px 0 rgba(24, 62, 64, 0.07)'
  },
  nav: {
    // 深黛青侧栏（深变体）：深黛墨 + 汝窑青调和（#1c3b3c）；浅变体回落到天青雾白底（bg middle）
    variants: { dark: { 'bg-color': mixColor('#182628', '#2B7A78', 0.25) } }
  }
})
