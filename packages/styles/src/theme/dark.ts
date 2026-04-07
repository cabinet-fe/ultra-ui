import { cssVar } from '../helper'
import { lightTheme } from './light'
import type { UITheme } from './ui-theme'

export const darkTheme: UITheme = lightTheme.new({
  // 主色调 - 使用更柔和的蓝色系
  color: {
    primary: '#4f8ff7', // 柔和的蓝色，比浅色主题稍微亮一些
    success: '#52c41a', // 清新的绿色
    warning: '#faad14', // 温暖的橙色
    danger: '#ff4d4f', // 醒目的红色
    info: '#13c2c2', // 青色
    disabled: '#212020', // 深灰色
    default: '#595959' // 中性灰
  },

  // 背景色 - 采用层次分明的深色系
  bg: {
    color: {
      bottom: '#0f0f0f', // 最深的背景色，用于最底层
      middle: '#1a1a1a', // 中间层背景色
      top: '#262626', // 顶层背景色，用于卡片、弹窗等
      hover: '#303030', // 悬停状态背景色
      black: '#000000' // 纯黑色
    },
    filter: {
      blur: 'blur(16px)',
      saturate: 'saturate(180%)'
    }
  },

  // 文字颜色 - 确保在深色背景下有良好的对比度
  'text-color': {
    title: '#f0f0f0', // 标题文字 - 高对比度白色
    main: '#d9d9d9', // 主要文字 - 柔和白色
    second: '#a6a6a6', // 次要文字 - 中等灰色
    placeholder: '#737373', // 占位符文字 - 较暗灰色
    assist: '#595959', // 辅助文字 - 深灰色
    disabled: '#434343', // 禁用状态文字
    white: '#ffffff' // 纯白色
  },

  // 边框颜色
  border: {
    color: '#404040' // 深灰色边框，在深色背景下清晰可见
  },

  // 复选框样式
  checkbox: {
    border: '#595959' // 深灰色边框
  },

  // 单选框样式
  radio: {
    border: '#595959' // 深灰色边框
  },

  // 阴影 - 使用白色阴影增强层次感
  shadow: {
    color: 'rgba(255, 255, 255, 0.2)', // 柔和的白色阴影
    x: 0,
    y: 2,
    blur: 8,
    spread: 0
  },

  // 菜单样式
  menu: {
    hover: {
      bg: 'rgba(148, 163, 184, 0.14)', // 更轻的中性悬停色
      color: cssVar('text-color-title')
    },
    active: {
      bg: 'rgba(96, 165, 250, 0.2)', // 收敛激活底色，配合强调条显示
      color: cssVar('text-color-white')
    },
    bg: {
      color: cssVar('bg-color-middle'), // 收敛为实体面板背景
      blur: 'none',
      saturate: 'none',
      image: ''
    },
    color: cssVar('text-color-main') // 使用主要文字颜色
  },

  // 表格样式
  table: {
    header: {
      bg: '#2a2a2a',
      color: cssVar('text-color-main')
    },
    'border-color': '#404040', // 表格边框颜色
    stripe: {
      bg: '#2a2a2a', // 斑马纹背景色
      color: cssVar('text-color-main')
    },
    hover: {
      bg: '#333333', // 悬停行背景色
      color: cssVar('text-color-title')
    },
    current: {
      bg: cssVar('bg-color-hover'),
      color: 'inherit'
    },
    checked: {
      bg: 'var(--color-primary-dark-1)',
      color: 'inherit'
    }
  }
})
