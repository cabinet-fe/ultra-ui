# Theme tokens（类型与 light/dark 预设）

```typescript
/**
 * RGB颜色[红,绿,蓝]
 */
export type RGBColor = [number, number, number]

/** 仅含全局 token；组件级 `--u-*` 由 `theme/component-css-vars.ts` 随 `loadTheme` 注入 */
export type Theme = {
  /** 主题色 */
  color: {
    /** 主要颜色 */
    primary: string
    /** 成功颜色 */
    success: string
    /** 警告颜色 */
    warning: string
    /** 危险颜色 */
    danger: string
    /** 信息颜色 */
    info: string
    /** 禁用颜色 */
    disabled: string
    /** 默认颜色 */
    default: string
  }
  /** 背景 */
  bg: {
    /** 背景色 */
    color: {
      /** 底部背景色 */
      bottom: string
      /** 中部背景色 */
      middle: string
      /** 顶部背景色 */
      top: string
      /** 悬停背景色 */
      hover: string
      /** 黑色背景 */
      black: string
    }

    filter: {
      /** 背景模糊 */
      blur: string
      /** 背景饱和度 */
      saturate: string
    }
  }

  border: {
    /** 边框颜色 */
    color: string
    /** 边框宽度 */
    width: number
    /** 边框样式 */
    style: string
  }

  /** 文字色 */
  'text-color': {
    /** 标题文字颜色 */
    title: string
    /** 主要文字颜色 */
    main: string
    /** 占位符文字颜色 */
    placeholder: string
    /** 次要文字颜色 */
    second: string
    /** 辅助文字颜色 */
    assist: string
    /** 禁用文字颜色 */
    disabled: string
    /** 白色文字 */
    white: string
  }
  /** 圆角大小 */
  radius: {
    /** 小圆角 */
    small: number
    /** 默认圆角 */
    default: number
    /** 大圆角 */
    large: number
  }
  /** 表单组件高度 */
  'form-component-height': {
    /** 小尺寸表单组件高度 */
    small: number
    /** 默认尺寸表单组件高度 */
    default: number
    /** 大尺寸表单组件高度 */
    large: number
  }

  /** 字体族 */
  'font-family': string
  /** 标题字体大小 */
  'font-size-title': {
    /** 小尺寸标题字体 */
    small: number
    /** 默认尺寸标题字体 */
    default: number
    /** 大尺寸标题字体 */
    large: number
  }
  /** 正文字体大小 */
  'font-size-main': {
    /** 小尺寸正文字体 */
    small: number
    /** 默认尺寸正文字体 */
    default: number
    /** 大尺寸正文字体 */
    large: number
  }
  /** 辅助文字字体大小 */
  'font-size-assist': {
    /** 小尺寸辅助文字字体 */
    small: number
    /** 默认尺寸辅助文字字体 */
    default: number
    /** 大尺寸辅助文字字体 */
    large: number
  }
  /** 阴影 */
  shadow: {
    /** 阴影颜色 */
    color: string
    /** 阴影水平偏移 */
    x: number
    /** 阴影垂直偏移 */
    y: number
    /** 阴影模糊半径 */
    blur: number
    /** 阴影扩散半径 */
    spread: number
  }
  /** 间距 */
  gap: {
    /** 小间距 */
    small: number
    /** 默认间距 */
    default: number
    /** 大间距 */
    large: number
  }
  /** 断点 */
  breakpoint: {
    /** 超小屏幕断点 */
    xs: number
    /** 小屏幕断点 */
    sm: number
    /** 中等屏幕断点 */
    md: number
    /** 大屏幕断点 */
    lg: number
  }
}
```

---

```typescript
import { defineBySize } from './helper'
import { UITheme } from './ui-theme'

export const lightTheme: UITheme = new UITheme(
  {
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

    'font-family':
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',

    'font-size-title': defineBySize({ small: 16, default: 16, large: 18 }),

    'font-size-main': defineBySize({ small: 12, default: 14, large: 16 }),

    'font-size-assist': defineBySize({ small: 12, default: 12, large: 14 }),

    shadow: { color: '#0000001a', x: 0, y: 0, blur: 4, spread: 1 },

    gap: defineBySize({ small: 6, default: 8, large: 12 }),

    breakpoint: { xs: 600, sm: 960, md: 1280, lg: 1920 }
  },
  { reactive: false }
)
```

---

```typescript
import { lightTheme } from './light'

export const darkTheme = lightTheme.new({
  color: {
    primary: '#4f8ff7',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#13c2c2',
    disabled: '#212020',
    default: '#595959'
  },

  bg: {
    color: {
      bottom: '#0f0f0f',
      middle: '#1a1a1a',
      top: '#262626',
      hover: '#303030',
      black: '#000000'
    },
    filter: { blur: 'blur(16px)', saturate: 'saturate(180%)' }
  },

  'text-color': {
    title: '#f0f0f0',
    main: '#d9d9d9',
    second: '#a6a6a6',
    placeholder: '#737373',
    assist: '#595959',
    disabled: '#434343',
    white: '#ffffff'
  },

  border: { color: '#404040' },

  shadow: { color: 'rgba(255, 255, 255, 0.2)', x: 0, y: 2, blur: 8, spread: 0 }
})
```
