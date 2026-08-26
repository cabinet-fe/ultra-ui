import { lightTheme } from './light'

/**
 * 玻璃拟态，天生适合深色（半透明背景 + 背景模糊在深色下层次最好）。
 * 背景为 rgba() 时派生 token（kbd / batch-edit 混合色）无法自动推导，
 * 需通过组件级扩展键显式声明。
 */
export const glassTheme = lightTheme.new(
  {
    color: {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      disabled: '#374151',
      default: '#1E293B'
    },
    bg: {
      color: {
        bottom: 'rgba(15, 23, 42, 0.6)',
        middle: 'rgba(15, 23, 42, 0.7)',
        top: 'rgba(15, 23, 42, 0.75)',
        hover: 'rgba(30, 41, 59, 0.85)',
        black: '#000000'
      },
      filter: { blur: 'blur(20px)', saturate: 'saturate(200%)' }
    },
    border: {
      color: 'rgba(255, 255, 255, 0.18)',
      mutedColor: 'rgba(255, 255, 255, 0.1)',
      width: 1,
      style: 'solid'
    },
    'text-color': {
      title: '#F8FAFC',
      main: '#F1F5F9',
      second: '#94A3B8',
      placeholder: '#64748B',
      assist: '#64748B',
      disabled: '#475569',
      white: '#ffffff'
    },
    shadow: {
      color: '#00000059',
      x: 0,
      y: 4,
      blur: 32,
      spread: 0,
      emboss: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
      lg: '0 8px 24px 0 rgba(0, 0, 0, 0.55), 0 2px 6px 0 rgba(0, 0, 0, 0.35)'
    },
    kbd: {
      'inset-shadow': 'rgba(0, 0, 0, 0.5)',
      'border-shadow': 'rgba(255, 255, 255, 0.09)',
      'drop-shadow': 'rgba(0, 0, 0, 0.6)'
    },
    'batch-edit': { 'form-header-bg': 'rgba(15, 23, 42, 0.8)' }
  },
  { series: 'dark' }
)
