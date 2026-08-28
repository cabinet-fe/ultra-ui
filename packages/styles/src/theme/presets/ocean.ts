import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 海盐（松石青 + 冷白底，利落的快缓动），天生适合浅色 */
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
    second: '#5b7875',
    assist: '#c3d6d4',
    placeholder: '#7fa19e',
    disabled: '#a3bab7'
  },
  border: { width: 1, color: '#c2dedb', mutedColor: '#8fbcb7' },
  radius: { small: 6, default: 10, large: 14 },
  shadow: {
    color: 'rgba(21, 94, 89, 0.12)',
    x: 0,
    y: 2,
    blur: 10,
    spread: -1,
    sm: '0 1px 2px 0 rgba(21, 94, 89, 0.08)',
    lg: '0 8px 24px 0 rgba(21, 94, 89, 0.12), 0 2px 6px 0 rgba(21, 94, 89, 0.06)'
  },
  transition: { fast: '0.12s', ease: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  nav: {
    // 深海礁侧栏：深礁 + 松石青调和
    'bg-color': mixColor('#16302e', '#0d9488', 0.25)
  }
})
