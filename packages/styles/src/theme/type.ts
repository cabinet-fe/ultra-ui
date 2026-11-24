export type RGBColor = [number, number, number]

/** 仅含全局 token；组件级 `--u-*` 由 `theme/component-css-vars.ts` 随 `loadTheme` 注入 */
export type Theme = {
  color: {
    primary: string
    success: string
    warning: string
    danger: string
    info: string
    disabled: string
    default: string
  }
  bg: {
    color: { bottom: string; middle: string; top: string; hover: string; black: string }

    filter: { blur: string; saturate: string }
  }

  border: {
    /** 边框颜色（结构性，始终可见） */
    color: string
    /** 弱化边框颜色（表单类组件用） */
    mutedColor: string
    width: number
    style: string
  }

  'text-color': {
    title: string
    main: string
    placeholder: string
    second: string
    assist: string
    disabled: string
    white: string
  }
  radius: { small: number; default: number; large: number }
  'form-component-height': { small: number; default: number; large: number }

  'font-family': string
  'font-size-title': { small: number; default: number; large: number }
  'font-size-main': { small: number; default: number; large: number }
  'font-size-assist': { small: number; default: number; large: number }
  shadow: {
    color: string
    x: number
    y: number
    blur: number
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
    normal: string
    /** 慢速过渡时长（浮层进出、展开收起） */
    slow: string
    ease: string
    /** 入场缓动曲线 */
    easeOut: string
  }
  gap: { small: number; default: number; large: number }
  breakpoint: { xs: number; sm: number; md: number; lg: number }
  button?: { 'default-bg'?: string; [key: string]: any }
  /**
   * 侧栏导航（nav / dual-nav / group-nav）组件级变量。
   * `variant` 选择默认深/浅侧栏外观；顶层其余字符串键对所有变体生效并覆盖同名
   * `--u-nav-*` token（如 `'bg-color'` → `--u-nav-bg-color`）；
   * `variants` 可为两个变体分别定制外观，只在该变体生效且优先级最高。
   */
  nav?: {
    /** 侧栏默认外观：dark 深底浅字 / light 浅底深字，默认 dark */
    variant?: 'dark' | 'light'
    /**
     * 按变体定制的外观覆盖，键同 nav 顶层（如 `'bg-color'`）。
     * 未声明的变体回落到内置「主题系列 × 变体」token。
     */
    variants?: Partial<Record<'dark' | 'light', Record<string, string>>>
    [key: string]: any
  }
  collapse?: { 'title-color'?: string; [key: string]: any }
  [key: string]: any
}
