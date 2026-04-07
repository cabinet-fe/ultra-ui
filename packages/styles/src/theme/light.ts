import { cssVar, defineBySize } from '../helper'
import { UITheme } from './ui-theme'

export const lightTheme: UITheme = new UITheme({
  color: {
    primary: '#1E88E5',
    success: '#2ba471',
    warning: '#e37318',
    danger: '#d54941',
    info: '#009688',
    disabled: '#f5f7fa',
    default: '#f1f5f9'
  },

  bg: {
    color: {
      bottom: '#f5f5f5',
      middle: '#fafafa',
      top: '#ffffff',
      hover: '#f5f7fa',
      black: '#000000'
    },

    filter: { blur: 'blur(16px)', saturate: 'saturate(180%)' }
  },

  border: { color: '#dcdfe6', width: 1, style: 'solid' },

  checkbox: { border: '#ccc' },

  radio: { border: '#ccc' },

  'text-color': {
    title: '#303133',
    main: '#606266',
    placeholder: '#a8abb2',
    second: '#979797',
    assist: '#c0c4cc',
    disabled: '#a8abb2',
    white: '#fff'
  },

  radius: defineBySize({ small: 4, default: 6, large: 8 }),

  'form-component-height': defineBySize({ small: 24, default: 32, large: 40 }),

  menu: {
    height: defineBySize({ small: 32, default: 36, large: 40 }),

    hover: { bg: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-color-title)' },

    active: { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--color-primary-dark-1)' },

    bg: { color: 'var(--bg-color-top)', blur: 'none', saturate: 'none', image: '' },

    color: '#0f172a'
  },

  'font-family':
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',

  'font-size-title': defineBySize({ small: 16, default: 16, large: 18 }),

  'font-size-main': defineBySize({ small: 12, default: 14, large: 16 }),

  'font-size-assist': defineBySize({ small: 12, default: 12, large: 14 }),

  shadow: { color: '#0000001a', x: 0, y: 0, blur: 4, spread: 1 },

  tag: defineBySize({ small: 20, default: 24, large: 28 }),

  gap: defineBySize({ small: 6, default: 8, large: 12 }),

  breakpoint: { xs: 600, sm: 960, md: 1280, lg: 1920 },

  table: {
    'border-color': '#e9e9e9',
    header: { bg: '#f4f5f7', color: cssVar('text-color-title') },
    stripe: { bg: '#f8fafc', color: 'inherit' },
    hover: { bg: cssVar('bg-color-hover'), color: 'inherit' },
    current: { bg: cssVar('bg-color-hover'), color: 'inherit' },
    checked: { bg: 'var(--color-primary-light-9)', color: 'inherit' }
  },

  switch: { height: defineBySize({ small: 18, default: 20, large: 24 }) }
})
