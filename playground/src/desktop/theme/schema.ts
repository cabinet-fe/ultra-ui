/**
 * 主题编辑器字段分组定义。
 * 覆盖 packages/styles/src/theme/type.ts 中 Theme 的全部全局 token。
 */

export type ThemeFieldKind = 'color' | 'number' | 'text' | 'select'

export interface ThemeFieldOption {
  label: string
  value: string
}

export interface ThemeField {
  /** 唯一标识，同 path.join('.') */
  key: string
  /** 中文标签 */
  label: string
  /** 在 Theme 对象上的路径 */
  path: string[]
  kind: ThemeFieldKind
  min?: number
  max?: number
  step?: number
  placeholder?: string
  options?: ThemeFieldOption[]
}

export interface ThemeSection {
  key: string
  title: string
  description: string
  fields: ThemeField[]
}

function color(label: string, path: string[]): ThemeField {
  return { key: path.join('.'), label, path, kind: 'color' }
}

function num(label: string, path: string[], min: number, max: number, step = 1): ThemeField {
  return { key: path.join('.'), label, path, kind: 'number', min, max, step }
}

function text(label: string, path: string[], placeholder?: string): ThemeField {
  return { key: path.join('.'), label, path, kind: 'text', placeholder }
}

function select(label: string, path: string[], options: ThemeFieldOption[]): ThemeField {
  return { key: path.join('.'), label, path, kind: 'select', options }
}

const borderStyleOptions: ThemeFieldOption[] = [
  { label: '实线 solid', value: 'solid' },
  { label: '虚线 dashed', value: 'dashed' },
  { label: '点线 dotted', value: 'dotted' },
  { label: '双线 double', value: 'double' }
]

export const THEME_SECTIONS: ThemeSection[] = [
  {
    key: 'color',
    title: '语义色',
    description: '品牌色与状态色，自动派生 light-1/3/5/7/9 与 dark-* 梯度及 alpha token',
    fields: [
      color('主要颜色', ['color', 'primary']),
      color('成功颜色', ['color', 'success']),
      color('警告颜色', ['color', 'warning']),
      color('危险颜色', ['color', 'danger']),
      color('信息颜色', ['color', 'info']),
      color('禁用颜色', ['color', 'disabled']),
      color('默认颜色', ['color', 'default'])
    ]
  },
  {
    key: 'bg',
    title: '背景层次',
    description: '自底向上的表面背景与背景滤镜',
    fields: [
      color('底部背景', ['bg', 'color', 'bottom']),
      color('中部背景', ['bg', 'color', 'middle']),
      color('顶部背景', ['bg', 'color', 'top']),
      color('悬停背景', ['bg', 'color', 'hover']),
      color('黑色背景', ['bg', 'color', 'black']),
      text('背景模糊', ['bg', 'filter', 'blur'], 'blur(16px) 或 none'),
      text('背景饱和度', ['bg', 'filter', 'saturate'], 'saturate(180%) 或 none')
    ]
  },
  {
    key: 'text-color',
    title: '文字色',
    description: '标题 / 正文 / 占位 / 辅助等文字层级颜色',
    fields: [
      color('标题文字', ['text-color', 'title']),
      color('主要文字', ['text-color', 'main']),
      color('次要文字', ['text-color', 'second']),
      color('占位文字', ['text-color', 'placeholder']),
      color('辅助文字', ['text-color', 'assist']),
      color('禁用文字', ['text-color', 'disabled']),
      color('白色文字', ['text-color', 'white'])
    ]
  },
  {
    key: 'border',
    title: '边框',
    description: '结构分隔线与表单控件描边',
    fields: [
      color('边框颜色', ['border', 'color']),
      color('弱化边框颜色', ['border', 'mutedColor']),
      num('边框宽度', ['border', 'width'], 0, 10),
      select('边框样式', ['border', 'style'], borderStyleOptions)
    ]
  },
  {
    key: 'shadow',
    title: '阴影',
    description: '基础阴影参数与 sm / lg / 浮雕完整阴影值',
    fields: [
      color('阴影颜色', ['shadow', 'color']),
      num('水平偏移', ['shadow', 'x'], -24, 24),
      num('垂直偏移', ['shadow', 'y'], -24, 24),
      num('模糊半径', ['shadow', 'blur'], 0, 64),
      num('扩散半径', ['shadow', 'spread'], -12, 24),
      text('低层级阴影 sm', ['shadow', 'sm'], '0 1px 2px 0 rgba(0,0,0,0.05)'),
      text('高层级阴影 lg', ['shadow', 'lg'], '0 8px 24px 0 rgba(0,0,0,0.12)'),
      text('浮雕阴影', ['shadow', 'emboss'], '非浮雕主题为 none')
    ]
  },
  {
    key: 'size',
    title: '圆角与尺寸',
    description: '圆角、表单组件高度与间距的三档尺度',
    fields: [
      num('小圆角', ['radius', 'small'], 0, 24),
      num('默认圆角', ['radius', 'default'], 0, 24),
      num('大圆角', ['radius', 'large'], 0, 32),
      num('小表单高度', ['form-component-height', 'small'], 16, 40),
      num('默认表单高度', ['form-component-height', 'default'], 20, 52),
      num('大表单高度', ['form-component-height', 'large'], 24, 64),
      num('小间距', ['gap', 'small'], 0, 20),
      num('默认间距', ['gap', 'default'], 0, 24),
      num('大间距', ['gap', 'large'], 0, 32)
    ]
  },
  {
    key: 'typography',
    title: '字体',
    description: '字体族与标题 / 正文 / 辅助文字的三档字号',
    fields: [
      text('字体族', ['font-family'], '"PingFang SC", sans-serif'),
      num('小标题字号', ['font-size-title', 'small'], 8, 28),
      num('默认标题字号', ['font-size-title', 'default'], 8, 32),
      num('大标题字号', ['font-size-title', 'large'], 10, 40),
      num('小正文字号', ['font-size-main', 'small'], 8, 20),
      num('默认正文字号', ['font-size-main', 'default'], 8, 24),
      num('大正文字号', ['font-size-main', 'large'], 10, 28),
      num('小辅助字号', ['font-size-assist', 'small'], 8, 18),
      num('默认辅助字号', ['font-size-assist', 'default'], 8, 20),
      num('大辅助字号', ['font-size-assist', 'large'], 8, 24)
    ]
  },
  {
    key: 'transition',
    title: '动效',
    description: '过渡时长与缓动曲线（值须带单位）',
    fields: [
      text('快速过渡', ['transition', 'fast'], '0.15s'),
      text('常规过渡', ['transition', 'normal'], '0.25s'),
      text('慢速过渡', ['transition', 'slow'], '0.35s'),
      text('标准缓动', ['transition', 'ease'], 'cubic-bezier(0.4, 0, 0.2, 1)'),
      text('入场缓动', ['transition', 'easeOut'], 'cubic-bezier(0, 0, 0.2, 1)')
    ]
  },
  {
    key: 'breakpoint',
    title: '响应断点',
    description: '布局与响应式行为使用的断点（px）',
    fields: [
      num('超小屏幕', ['breakpoint', 'xs'], 320, 900),
      num('小屏幕', ['breakpoint', 'sm'], 480, 1200),
      num('中屏幕', ['breakpoint', 'md'], 768, 1600),
      num('大屏幕', ['breakpoint', 'lg'], 1024, 2560)
    ]
  },
  {
    key: 'component',
    title: '组件级变量',
    description: '挂在 Theme 上的组件级覆盖项',
    fields: [text('按钮默认背景', ['button', 'default-bg'], 'var(--u-bg-color-top)')]
  }
]

/** 字段对应的 CSS 变量名，如 ['text-color','title'] → --u-text-color-title */
export function cssVarName(path: string[]): string {
  return `--u-${path.join('-')}`
}
