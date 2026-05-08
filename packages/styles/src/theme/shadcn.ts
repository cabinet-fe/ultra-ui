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
  border: { color: '#e4e4e7' },
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
  shadow: { color: 'rgba(0, 0, 0, 0.05)', x: 0, y: 1, blur: 2, spread: 0, emboss: 'none' }
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
  border: { color: '#27272a' },
  'text-color': {
    title: '#fafafa',
    main: '#fafafa',
    second: '#a1a1aa',
    placeholder: '#71717a',
    assist: '#71717a',
    disabled: '#71717a',
    white: '#000000'
  }
})
