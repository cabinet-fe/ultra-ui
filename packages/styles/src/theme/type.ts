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
    /** 边框颜色（结构性，始终可见） */
    color: string
    /** 弱化边框颜色（表单类组件用） */
    mutedColor: string
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
    /** 浮雕阴影：非浮雕主题为 'none'，浮雕主题为完整 box-shadow 值 */
    emboss: string
    /** 低层级阴影（卡片等贴面元素），完整 box-shadow 值 */
    sm: string
    /** 高层级阴影（弹窗、下拉等浮层），完整 box-shadow 值 */
    lg: string
  }
  /** 动效：时长与缓动（值须带单位或为合法 CSS 字符串，数字会被补 px） */
  transition: {
    /** 快速过渡时长（微交互：hover、焦点） */
    fast: string
    /** 常规过渡时长 */
    normal: string
    /** 慢速过渡时长（浮层进出、展开收起） */
    slow: string
    /** 标准缓动曲线 */
    ease: string
    /** 入场缓动曲线 */
    easeOut: string
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
  /** 按钮组件级变量 */
  button?: {
    /** 默认按钮背景色 */
    'default-bg'?: string
    [key: string]: any
  }
  /**
   * 侧栏导航（nav / dual-nav / group-nav）组件级变量。
   * variant 选择深/浅侧栏外观，其余键覆盖同名 `--u-nav-*` token
   * （如 `'bg-color'` → `--u-nav-bg-color`），覆盖优先级高于 variant 内置值。
   */
  nav?: {
    /** 侧栏外观：dark 深底浅字 / light 浅底深字，默认 dark */
    variant?: 'dark' | 'light'
    [key: string]: any
  }
  /** 折叠面板组件级变量 */
  collapse?: {
    /** 折叠项标题文字颜色 */
    'title-color'?: string
    [key: string]: any
  }
  [key: string]: any
}
