export type ThemeFieldKind = 'palette' | 'input' | 'number' | 'select'

export interface ThemeFieldOption {
  label: string
  value: string
}

export interface ThemeField {
  key: string
  label: string
  path: string[]
  kind: ThemeFieldKind
  hint?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  options?: ThemeFieldOption[]
}

export interface ThemeSection {
  key: string
  title: string
  description: string
  fields: ThemeField[]
}

const borderStyleOptions: ThemeFieldOption[] = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双线', value: 'double' }
]

function paletteField(key: string, label: string, path: string[], hint?: string): ThemeField {
  return { key, label, path, kind: 'palette', hint }
}

function inputField(
  key: string,
  label: string,
  path: string[],
  placeholder?: string,
  hint?: string
): ThemeField {
  return { key, label, path, kind: 'input', placeholder, hint }
}

function numberField(
  key: string,
  label: string,
  path: string[],
  options: Pick<ThemeField, 'min' | 'max' | 'step' | 'suffix' | 'hint'>
): ThemeField {
  return {
    key,
    label,
    path,
    kind: 'number',
    min: options.min,
    max: options.max,
    step: options.step,
    suffix: options.suffix,
    hint: options.hint
  }
}

function pxField(
  key: string,
  label: string,
  path: string[],
  min: number,
  max: number,
  hint?: string
): ThemeField {
  return numberField(key, label, path, { min, max, step: 1, suffix: 'px', hint })
}

function selectField(
  key: string,
  label: string,
  path: string[],
  options: ThemeFieldOption[],
  hint?: string
): ThemeField {
  return { key, label, path, kind: 'select', options, hint }
}

export const THEME_SECTIONS: ThemeSection[] = [
  {
    key: 'color',
    title: '综合色板',
    description: '品牌色与语义状态色，决定按钮、标签与反馈态的主视觉。',
    fields: [
      paletteField('color.primary', '主要颜色', ['color', 'primary']),
      paletteField('color.success', '成功颜色', ['color', 'success']),
      paletteField('color.warning', '警告颜色', ['color', 'warning']),
      paletteField('color.danger', '危险颜色', ['color', 'danger']),
      paletteField('color.info', '信息颜色', ['color', 'info']),
      paletteField('color.disabled', '禁用颜色', ['color', 'disabled']),
      paletteField('color.default', '默认颜色', ['color', 'default'])
    ]
  },
  {
    key: 'surface',
    title: '表面层次',
    description: '控制背景、文字、边框与阴影，决定整个界面的空气感与对比度。',
    fields: [
      paletteField('bg.color.top', '顶部背景', ['bg', 'color', 'top']),
      paletteField('bg.color.middle', '中部背景', ['bg', 'color', 'middle']),
      paletteField('bg.color.bottom', '底部背景', ['bg', 'color', 'bottom']),
      paletteField('bg.color.hover', '悬停背景', ['bg', 'color', 'hover']),
      paletteField('bg.color.black', '黑色背景', ['bg', 'color', 'black']),
      inputField('bg.filter.blur', '背景模糊', ['bg', 'filter', 'blur'], '例如：blur(16px)'),
      inputField(
        'bg.filter.saturate',
        '背景饱和度',
        ['bg', 'filter', 'saturate'],
        '例如：saturate(180%)'
      ),
      paletteField('text-color.title', '标题文字', ['text-color', 'title']),
      paletteField('text-color.main', '主要文字', ['text-color', 'main']),
      paletteField('text-color.placeholder', '占位文字', ['text-color', 'placeholder']),
      paletteField('text-color.second', '次要文字', ['text-color', 'second']),
      paletteField('text-color.assist', '辅助文字', ['text-color', 'assist']),
      paletteField('text-color.disabled', '禁用文字', ['text-color', 'disabled']),
      paletteField('text-color.white', '白色文字', ['text-color', 'white']),
      paletteField('border.color', '边框颜色', ['border', 'color']),
      pxField('border.width', '边框宽度', ['border', 'width'], 0, 10),
      selectField('border.style', '边框样式', ['border', 'style'], borderStyleOptions),
      paletteField('shadow.color', '阴影颜色', ['shadow', 'color']),
      pxField('shadow.x', '水平偏移', ['shadow', 'x'], -24, 24),
      pxField('shadow.y', '垂直偏移', ['shadow', 'y'], -24, 24),
      pxField('shadow.blur', '模糊半径', ['shadow', 'blur'], 0, 64),
      pxField('shadow.spread', '扩散半径', ['shadow', 'spread'], -12, 24)
    ]
  },
  {
    key: 'control',
    title: '表单尺度',
    description: '统一基础控件的边角、尺寸和节奏，让组件家族看起来更一致。',
    fields: [
      pxField('radius.small', '小圆角', ['radius', 'small'], 0, 24),
      pxField('radius.default', '默认圆角', ['radius', 'default'], 0, 24),
      pxField('radius.large', '大圆角', ['radius', 'large'], 0, 32),
      pxField(
        'form-component-height.small',
        '小表单高度',
        ['form-component-height', 'small'],
        16,
        40
      ),
      pxField(
        'form-component-height.default',
        '默认表单高度',
        ['form-component-height', 'default'],
        20,
        52
      ),
      pxField(
        'form-component-height.large',
        '大表单高度',
        ['form-component-height', 'large'],
        24,
        64
      ),
      pxField('gap.small', '小间距', ['gap', 'small'], 0, 20),
      pxField('gap.default', '默认间距', ['gap', 'default'], 0, 24),
      pxField('gap.large', '大间距', ['gap', 'large'], 0, 32)
    ]
  },
  {
    key: 'typography',
    title: '字体系统',
    description: '管理字体族与标题、正文、辅助文本的层级尺寸。',
    fields: [
      inputField(
        'font-family',
        '字体族',
        ['font-family'],
        '例如："IBM Plex Sans", "PingFang SC", sans-serif'
      ),
      pxField('font-size-title.small', '小标题字号', ['font-size-title', 'small'], 8, 28),
      pxField('font-size-title.default', '默认标题字号', ['font-size-title', 'default'], 8, 32),
      pxField('font-size-title.large', '大标题字号', ['font-size-title', 'large'], 10, 40),
      pxField('font-size-main.small', '小正文字号', ['font-size-main', 'small'], 8, 20),
      pxField('font-size-main.default', '默认正文字号', ['font-size-main', 'default'], 8, 24),
      pxField('font-size-main.large', '大正文字号', ['font-size-main', 'large'], 10, 28),
      pxField('font-size-assist.small', '小辅助字号', ['font-size-assist', 'small'], 8, 18),
      pxField('font-size-assist.default', '默认辅助字号', ['font-size-assist', 'default'], 8, 20),
      pxField('font-size-assist.large', '大辅助字号', ['font-size-assist', 'large'], 8, 24)
    ]
  },
  {
    key: 'responsive',
    title: '响应断点',
    description: '维护布局与响应式行为使用的断点变量。',
    fields: [
      pxField('breakpoint.xs', '超小屏幕', ['breakpoint', 'xs'], 320, 900),
      pxField('breakpoint.sm', '小屏幕', ['breakpoint', 'sm'], 480, 1200),
      pxField('breakpoint.md', '中屏幕', ['breakpoint', 'md'], 768, 1600),
      pxField('breakpoint.lg', '大屏幕', ['breakpoint', 'lg'], 1024, 2560)
    ]
  }
]

export const THEME_FIELD_COUNT = THEME_SECTIONS.reduce((count, section) => {
  return count + section.fields.length
}, 0)
