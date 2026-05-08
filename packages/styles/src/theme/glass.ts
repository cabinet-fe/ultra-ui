import { lightTheme } from './light'

export const glassLightTheme = lightTheme.new({
  color: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    disabled: '#E5E7EB',
    default: '#F3F4F6'
  },
  bg: {
    color: {
      bottom: 'rgba(255, 255, 255, 0.2)',
      middle: 'rgba(255, 255, 255, 0.3)',
      top: 'rgba(255, 255, 255, 0.4)',
      hover: 'rgba(255, 255, 255, 0.55)',
      black: '#000000'
    },
    filter: { blur: 'blur(24px)', saturate: 'saturate(180%)' }
  },
  border: { color: 'rgba(255, 255, 255, 0.35)', width: 1, style: 'solid' },
  'text-color': {
    title: '#1E293B',
    main: '#334155',
    placeholder: '#94A3B8',
    second: '#64748B',
    assist: '#CBD5E1',
    disabled: '#94A3B8',
    white: '#FFFFFF'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.08)', x: 0, y: 4, blur: 24, spread: 0, emboss: 'none' }
})

export const glassDarkTheme = glassLightTheme.new({
  color: { disabled: '#374151', default: '#1E293B' },
  bg: {
    color: {
      bottom: 'rgba(10, 15, 30, 0.2)',
      middle: 'rgba(15, 23, 42, 0.3)',
      top: 'rgba(15, 23, 42, 0.4)',
      hover: 'rgba(30, 41, 59, 0.55)',
      black: '#000000'
    },
    filter: { blur: 'blur(32px)', saturate: 'saturate(200%)' }
  },
  border: { color: 'rgba(255, 255, 255, 0.08)' },
  'text-color': {
    title: '#F8FAFC',
    main: '#F1F5F9',
    second: '#94A3B8',
    placeholder: '#64748B',
    assist: '#64748B',
    disabled: '#475569',
    white: '#000000'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.35)', x: 0, y: 4, blur: 32, spread: 0, emboss: 'none' }
})
