import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 狂野（牛皮纸底 + 碳黑粗线 + 电光紫，硬偏移阴影、零圆角），天生适合浅色 */
export const wildTheme = lightTheme.new({
  color: {
    primary: '#6C2BD9', // 电光紫
    success: '#4FA01E', // 毒绿
    warning: '#E8720C', // 安全橙
    danger: '#DC2626', // 血红
    info: '#0B87A8', // 冲击蓝
    disabled: '#F0EDE4',
    default: '#F0EDE4'
  },
  bg: { color: { bottom: '#EDE9DE', middle: '#F5F2E9', top: '#FEFDF7', hover: '#E3DCC7' } },
  'text-color': {
    title: '#16130E', // 碳黑
    main: '#302B22',
    second: '#675F4F',
    assist: '#C2BAA5',
    placeholder: '#7A7159',
    disabled: '#8F8670'
  },
  border: { width: 2, color: '#242019', mutedColor: '#16130E', style: 'solid' },
  radius: { small: 0, default: 0, large: 0 },
  // 厚重控件：配合粗描边的体量感
  'form-component-height': { small: 26, default: 34, large: 44 },
  gap: { small: 8, default: 10, large: 16 },
  shadow: {
    color: 'rgba(22, 19, 14, 0.95)',
    x: 3,
    y: 3,
    blur: 0,
    spread: 0,
    emboss: '3px 3px 0 0 #16130E', // 硬偏移阴影压到按钮/输入框上（emboss 是控件级 box-shadow），粗野主义签名元素
    sm: '2px 2px 0 0 #16130E',
    lg: '6px 6px 0 0 #16130E'
  },
  transition: {
    fast: '0.08s',
    normal: '0.14s',
    ease: 'cubic-bezier(0.7, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)'
  },
  nav: {
    // 紫黑侧栏（深变体）：碳黑 + 电光紫调和；浅变体回落到牛皮纸底（bg middle）
    variants: { dark: { 'bg-color': mixColor('#16130E', '#6C2BD9', 0.32) } }
  }
})
