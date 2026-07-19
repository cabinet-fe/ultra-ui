import { defineBySize } from '../helper'
import { UITheme } from '../ui-theme'

export const lightTheme: UITheme = new UITheme(
  {
    color: {
      primary: '#2563eb',
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#0891b2',
      disabled: '#f4f4f5',
      default: '#f4f4f5'
    },

    bg: {
      color: {
        bottom: '#f4f4f5',
        middle: '#fafafa',
        top: '#ffffff',
        hover: '#f4f4f5',
        black: '#000000'
      },

      filter: { blur: 'none', saturate: 'none' }
    },

    border: { color: '#e4e4e7', mutedColor: '#e4e4e7', width: 1, style: 'solid' },

    'text-color': {
      title: '#18181b',
      main: '#3f3f46',
      placeholder: '#a1a1aa',
      second: '#71717a',
      assist: '#d4d4d8',
      disabled: '#a1a1aa',
      white: '#fff'
    },

    radius: defineBySize({ small: 4, default: 6, large: 8 }),

    'form-component-height': defineBySize({ small: 24, default: 32, large: 40 }),

    'font-family':
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',

    'font-size-title': defineBySize({ small: 14, default: 16, large: 18 }),

    'font-size-main': defineBySize({ small: 12, default: 14, large: 16 }),

    'font-size-assist': defineBySize({ small: 12, default: 12, large: 14 }),

    shadow: {
      color: '#00000014',
      x: 0,
      y: 1,
      blur: 3,
      spread: 0,
      emboss: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      lg: '0 8px 24px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06)'
    },

    transition: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.35s',
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)'
    },

    gap: defineBySize({ small: 6, default: 8, large: 12 }),

    breakpoint: { xs: 600, sm: 960, md: 1280, lg: 1920 },

    button: { 'default-bg': 'var(--u-bg-color-top)' }
  },
  { reactive: false }
)
