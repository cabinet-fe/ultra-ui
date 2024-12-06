import { defineBySize } from '../helper'
import { UITheme } from './ui-theme'

export const lightTheme = new UITheme({
  color: {
    primary: '#3670f7',
    success: '#2ba471',
    warning: '#e37318',
    danger: '#d54941',
    info: '#009688',
    disabled: '#f5f7fa',
    default: '#f1f5f9'
  },

  bgColor: {
    bottom: '#fdfdfd',
    middle: '#fefefe',
    top: '#ffffff',
    hover: '#f5f7fa',
    black: '#000000'
  },

  bgFilter: {
    blur: 'blur(16px)',
    saturate: 'saturate(180%)'
  },

  border: {
    color: '#dcdfe6',
    width: 1,
    style: 'solid'
  },

  textColor: {
    title: '#303133',
    main: '#606266',
    placeholder: '#a8abb2',
    second: '#979797',
    assist: '#c0c4cc',
    disabled: '#a8abb2',
    white: '#fff'
  },

  radius: defineBySize({
    small: 2,
    default: 4,
    large: 8
  }),

  formComponentHeight: defineBySize({
    small: 24,
    default: 32,
    large: 40
  }),

  menuHeight: defineBySize({
    small: 32,
    default: 40,
    large: 48
  }),

  fontFamily:
    'Inter, "Roboto", "Segoe UI", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", "PingFang SC", sans-serif',

  fontSizeTitle: defineBySize({
    small: 16,
    default: 16,
    large: 18
  }),

  fontSizeMain: defineBySize({
    small: 12,
    default: 14,
    large: 16
  }),

  fontSizeAssist: defineBySize({
    small: 12,
    default: 12,
    large: 14
  }),

  shadow: {
    color: 'rgba(0, 0, 0, 0.1)',
    x: 0,
    y: 0,
    blur: 4,
    spread: 1
  },

  tag: defineBySize({
    small: 20,
    default: 24,
    large: 28
  }),

  gap: defineBySize({
    small: 6,
    default: 8,
    large: 12
  }),

  breakpoint: {
    xs: 600,
    sm: 960,
    md: 1280,
    lg: 1920
  },

  table: {
    borderColor: '#eee'
  }
})
