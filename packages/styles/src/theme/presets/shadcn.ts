import { lightTheme } from './light'

export const shadcnLightTheme = lightTheme.new({
  color: {
    primary: '#18181b', // zinc-900
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    disabled: '#f4f4f5',
    default: '#fafafa'
  },
  bg: {
    color: {
      bottom: '#f4f4f5',
      middle: '#fafafa',
      top: '#ffffff',
      hover: '#f4f4f5',
      black: '#000000'
    }
  },
  border: { color: '#e4e4e7', mutedColor: '#e4e4e7' },
  'text-color': {
    title: '#09090b',
    main: '#09090b',
    second: '#71717a',
    placeholder: '#a1a1aa',
    assist: '#a1a1aa',
    disabled: '#a1a1aa',
    white: '#ffffff'
  },
  radius: { small: 4, default: 6, large: 8 },
  shadow: { color: '#0000000d', x: 0, y: 1, blur: 2, spread: 0, emboss: 'none' },
  button: {
    'primary-text-color': '#ffffff',
    'primary-hover-bg': '#27272a',
    'primary-hover-color': '#ffffff'
  }
})

export const shadcnDarkTheme = shadcnLightTheme.new({
  color: {
    primary: '#fafafa', // zinc-50
    disabled: '#27272a',
    default: '#18181b'
  },
  bg: {
    color: {
      bottom: '#09090b',
      middle: '#18181b',
      top: '#27272a',
      hover: '#27272a',
      black: '#000000'
    }
  },
  border: { color: '#3f3f46', mutedColor: '#27272a' },
  'text-color': {
    title: '#fafafa',
    main: '#fafafa',
    second: '#a1a1aa',
    placeholder: '#71717a',
    assist: '#71717a',
    disabled: '#71717a',
    white: '#ffffff'
  },
  shadow: {
    color: '#00000066',
    x: 0,
    y: 1,
    blur: 2,
    spread: 0,
    emboss: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.5), 0 2px 6px 0 rgba(0, 0, 0, 0.35)'
  },
  button: {
    'primary-text-color': '#000000',
    'primary-hover-bg': '#e4e4e7',
    'primary-hover-color': '#000000',
    'primary-plain-color': '#fafafa'
  },
  checkbox: { color: '#000000' },
  tag: { 'primary-dark-color': '#000000' }
})
