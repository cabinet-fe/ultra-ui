import { lightTheme } from './light'

export const glassLightTheme = lightTheme.new({
  color: {
    primary: '#3B82F6', // Vibrant Blue
    success: '#10B981', // Vibrant Green
    warning: '#F59E0B', // Vibrant Orange
    danger: '#EF4444', // Vibrant Red
    info: '#06B6D4', // Vibrant Cyan
    disabled: '#E5E7EB',
    default: '#F3F4F6'
  },
  bg: {
    color: {
      bottom: 'rgba(255, 255, 255, 0.6)',
      middle: 'rgba(255, 255, 255, 0.7)',
      top: 'rgba(255, 255, 255, 0.8)',
      hover: 'rgba(255, 255, 255, 0.9)',
      black: '#000000'
    },
    filter: { blur: 'blur(12px)', saturate: 'saturate(150%)' }
  },
  border: { color: '#E2E8F0', width: 1, style: 'solid' },
  'text-color': {
    title: '#1E293B',
    main: '#334155',
    placeholder: '#94A3B8',
    second: '#64748B',
    assist: '#CBD5E1',
    disabled: '#94A3B8',
    white: '#FFFFFF'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.04)', x: 0, y: 4, blur: 16, spread: 0, emboss: 'none' }
})

export const glassDarkTheme = glassLightTheme.new({
  color: { disabled: '#374151', default: '#1E293B' },
  bg: {
    color: {
      bottom: 'rgba(15, 23, 42, 0.6)',
      middle: 'rgba(15, 23, 42, 0.7)',
      top: 'rgba(15, 23, 42, 0.8)',
      hover: 'rgba(30, 41, 59, 0.8)',
      black: '#000000'
    }
  },
  border: { color: '#27272A' },
  'text-color': {
    title: '#F8FAFC',
    main: '#F1F5F9',
    second: '#94A3B8',
    placeholder: '#64748B',
    assist: '#64748B',
    disabled: '#475569',
    white: '#000000'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.2)', x: 0, y: 4, blur: 16, spread: 0, emboss: 'none' }
})
