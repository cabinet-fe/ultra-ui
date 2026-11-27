import {
  auroraTheme,
  celadonTheme,
  darkTheme,
  gildedTheme,
  guochaoTheme,
  irisTheme,
  lightTheme,
  metalTheme,
  midnightTheme,
  neonTheme,
  newspaperTheme,
  wildTheme,
  type UITheme
} from '@veltra/styles/theme'

export type ThemeScope = 'base' | 'components'

export type ThemeFieldKind =
  | 'color'
  | 'number'
  | 'duration'
  | 'segment'
  | 'select'
  | 'focus-ring'
  | 'glass'

export type ThemeSubGroupLayout = 'color' | 'inline' | 'glass'

export interface ThemeFieldOption {
  label: string
  value: string
}

export interface ThemeField {
  key: string
  label: string
  path: string[]
  cssVar: string
  kind: ThemeFieldKind
  scope: ThemeScope
  /** 组件级或特殊字段在浅/深系列下的兜底 CSS 值（用于未在内置表声明时回显） */
  fallback?: string
  darkFallback?: string
  /** 是否写入 nav.variants[当前变体] */
  navVariant?: boolean
  min?: number
  max?: number
  step?: number
  unit?: string
  wide?: boolean
  preview?: 'font'
  focusToken?: 'primary' | 'danger'
  options?: ThemeFieldOption[]
}

export interface ThemeSubGroup {
  key: string
  title: string
  layout: ThemeSubGroupLayout
  fields: ThemeField[]
}

export interface ThemeSection {
  key: string
  scope: ThemeScope
  title: string
  description: string
  groups: ThemeSubGroup[]
}

export interface ThemePresetOption {
  label: string
  value: string
  series: 'light' | 'dark'
  theme: UITheme
}

export const THEME_PRESETS: ThemePresetOption[] = [
  { label: '默认浅色', value: 'light', series: 'light', theme: lightTheme },
  { label: '鸢尾（浅色）', value: 'iris', series: 'light', theme: irisTheme },
  { label: '天青（浅色）', value: 'celadon', series: 'light', theme: celadonTheme },
  { label: '国潮（浅色）', value: 'guochao', series: 'light', theme: guochaoTheme },
  { label: '狂野（浅色）', value: 'wild', series: 'light', theme: wildTheme },
  { label: '报刊（浅色）', value: 'newspaper', series: 'light', theme: newspaperTheme },
  { label: '默认深色', value: 'dark', series: 'dark', theme: darkTheme },
  { label: '极光（深色）', value: 'aurora', series: 'dark', theme: auroraTheme },
  { label: '午夜（深色）', value: 'midnight', series: 'dark', theme: midnightTheme },
  { label: '霓虹（深色）', value: 'neon', series: 'dark', theme: neonTheme },
  { label: '黑金（深色）', value: 'gilded', series: 'dark', theme: gildedTheme },
  { label: '金属（深色）', value: 'metal', series: 'dark', theme: metalTheme }
]

function toKebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function pathToCssVar(path: string[]): string {
  return `--u-${path.map(toKebab).join('-')}`
}

type FieldExtra = Partial<
  Pick<
    ThemeField,
    | 'fallback'
    | 'darkFallback'
    | 'navVariant'
    | 'min'
    | 'max'
    | 'step'
    | 'unit'
    | 'wide'
    | 'preview'
    | 'focusToken'
    | 'options'
  >
>

function makeField(
  scope: ThemeScope,
  kind: ThemeFieldKind,
  label: string,
  path: string[],
  extra?: FieldExtra
): ThemeField {
  return { key: path.join('.'), label, path, cssVar: pathToCssVar(path), kind, scope, ...extra }
}

const baseColor = (label: string, path: string[], extra?: FieldExtra) =>
  makeField('base', 'color', label, path, extra)

const baseNum = (label: string, path: string[], min: number, max: number, extra?: FieldExtra) =>
  makeField('base', 'number', label, path, { min, max, step: 1, unit: 'px', ...extra })

const baseDuration = (label: string, path: string[]) =>
  makeField('base', 'duration', label, path, { min: 0, max: 1000, step: 20, unit: 'ms' })

const baseSegment = (label: string, path: string[], options: ThemeFieldOption[]) =>
  makeField('base', 'segment', label, path, { options })

const baseSelect = (
  label: string,
  path: string[],
  options: ThemeFieldOption[],
  extra?: FieldExtra
) => makeField('base', 'select', label, path, { options, ...extra })

const baseGlass = (label: string, path: string[]) => makeField('base', 'glass', label, path)

const compColor = (label: string, path: string[], extra?: FieldExtra) =>
  makeField('components', 'color', label, path, extra)

const compNum = (label: string, path: string[], min: number, max: number, extra?: FieldExtra) =>
  makeField('components', 'number', label, path, { min, max, step: 1, unit: 'px', ...extra })

const compSegment = (label: string, path: string[], options: ThemeFieldOption[]) =>
  makeField('components', 'segment', label, path, { options })

const compSelect = (
  label: string,
  path: string[],
  options: ThemeFieldOption[],
  extra?: FieldExtra
) => makeField('components', 'select', label, path, { options, ...extra })

const compFocusRing = (label: string, path: string[], focusToken: 'primary' | 'danger') =>
  makeField('components', 'focus-ring', label, path, { focusToken, options: focusRingOptions })

const borderStyleOptions: ThemeFieldOption[] = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双线', value: 'double' }
]

const navVariantOptions: ThemeFieldOption[] = [
  { label: '深色侧栏', value: 'dark' },
  { label: '浅色侧栏', value: 'light' }
]

const fontFamilyOptions: ThemeFieldOption[] = [
  {
    label: '系统默认',
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  },
  { label: '现代无衬线', value: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif' },
  {
    label: '苹方 / 微软雅黑',
    value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  },
  { label: '优雅衬线', value: '"Noto Serif SC", "Songti SC", Georgia, serif' },
  {
    label: '等宽代码体',
    value: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace'
  }
]

const shadowSmOptions: ThemeFieldOption[] = [
  { label: '无阴影', value: 'none' },
  { label: '轻柔贴面（浅）', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  { label: '标准贴面（浅）', value: '0 2px 6px 0 rgba(0, 0, 0, 0.08)' },
  { label: '轻柔贴面（深）', value: '0 1px 2px 0 rgba(0, 0, 0, 0.4)' },
  { label: '硬偏移描边', value: '2px 2px 0 0 #16130E' }
]

const shadowLgOptions: ThemeFieldOption[] = [
  { label: '无阴影', value: 'none' },
  {
    label: '柔和浮层（浅）',
    value: '0 8px 24px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06)'
  },
  { label: '通透大浮层（浅）', value: '0 14px 36px -4px rgba(0, 0, 0, 0.16)' },
  {
    label: '柔和浮层（深）',
    value: '0 8px 24px 0 rgba(0, 0, 0, 0.5), 0 2px 6px 0 rgba(0, 0, 0, 0.35)'
  },
  { label: '硬偏移浮层', value: '6px 6px 0 0 #16130E' }
]

const shadowEmbossOptions: ThemeFieldOption[] = [
  { label: '无浮雕', value: 'none' },
  {
    label: '浅色微高光',
    value: '0 1px 2px 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)'
  },
  {
    label: '深色金属倒角',
    value:
      'inset 0 1px 0 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 0 rgba(0, 0, 0, 0.45), 0 1px 2px 0 rgba(0, 0, 0, 0.35)'
  },
  { label: '硬质偏移立体', value: '3px 3px 0 0 #16130E' }
]

const easingOptions: ThemeFieldOption[] = [
  { label: '标准缓动', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  { label: '柔和缓出', value: 'cubic-bezier(0.33, 1, 0.68, 1)' },
  { label: '利落缓出', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  { label: '强对比快入', value: 'cubic-bezier(0.85, 0, 0.15, 1)' },
  { label: '平滑缓入缓出', value: 'cubic-bezier(0.45, 0, 0.55, 1)' },
  { label: '匀速线性', value: 'linear' },
  { label: '轻弹回弹', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
]

const navBgImageOptions: ThemeFieldOption[] = [
  { label: '无背景图', value: 'none' },
  {
    label: '顶光柔晕',
    value: 'radial-gradient(120% 60% at 0% 0%, rgba(255, 255, 255, 0.12), transparent 60%)'
  },
  {
    label: '纵向微渐',
    value: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.18))'
  },
  { label: '斜向光感', value: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 55%)' }
]

const focusRingOptions: ThemeFieldOption[] = [
  { label: '关闭', value: '0' },
  { label: '细 2px', value: '2' },
  { label: '标准 3px', value: '3' },
  { label: '宽 4px', value: '4' }
]

export const THEME_SECTIONS: ThemeSection[] = [
  // ─── 基础样式（4 大类：颜色、字体排版、尺寸、其它） ───
  {
    key: 'color',
    scope: 'base',
    title: '颜色',
    description: '统一管理品牌语义色、表面背景层级、文字对比色及边框阴影色彩。',
    groups: [
      {
        key: 'color-semantic',
        title: '品牌与状态色',
        layout: 'color',
        fields: [
          baseColor('主要色', ['color', 'primary']),
          baseColor('成功色', ['color', 'success']),
          baseColor('警告色', ['color', 'warning']),
          baseColor('危险色', ['color', 'danger']),
          baseColor('信息色', ['color', 'info'])
        ]
      },
      {
        key: 'color-neutral',
        title: '中性色',
        layout: 'color',
        fields: [
          baseColor('默认色', ['color', 'default']),
          baseColor('禁用色', ['color', 'disabled'])
        ]
      },
      {
        key: 'color-bg',
        title: '背景颜色',
        layout: 'color',
        fields: [
          baseColor('底层背景', ['bg', 'color', 'bottom']),
          baseColor('中层背景', ['bg', 'color', 'middle']),
          baseColor('顶层背景', ['bg', 'color', 'top']),
          baseColor('悬停背景', ['bg', 'color', 'hover']),
          baseColor('纯黑背景', ['bg', 'color', 'black'])
        ]
      },
      {
        key: 'color-text',
        title: '字体颜色',
        layout: 'color',
        fields: [
          baseColor('标题文字', ['text-color', 'title']),
          baseColor('正文文字', ['text-color', 'main']),
          baseColor('次要文字', ['text-color', 'second']),
          baseColor('占位文字', ['text-color', 'placeholder']),
          baseColor('辅助文字', ['text-color', 'assist']),
          baseColor('禁用文字', ['text-color', 'disabled']),
          baseColor('反白文字', ['text-color', 'white'])
        ]
      },
      {
        key: 'color-border-shadow',
        title: '边框与阴影颜色',
        layout: 'color',
        fields: [
          baseColor('结构边框色', ['border', 'color']),
          baseColor('弱化边框色', ['border', 'mutedColor']),
          baseColor('阴影颜色', ['shadow', 'color'])
        ]
      }
    ]
  },
  {
    key: 'typography',
    scope: 'base',
    title: '字体排版',
    description: '选择字体家族并配置标题、正文与辅助文本的三档字号。',
    groups: [
      {
        key: 'font-family',
        title: '字体族',
        layout: 'inline',
        fields: [
          baseSelect('字体风格', ['font-family'], fontFamilyOptions, {
            wide: true,
            preview: 'font'
          })
        ]
      },
      {
        key: 'font-size-title',
        title: '标题字号',
        layout: 'inline',
        fields: [
          baseNum('小号标题', ['font-size-title', 'small'], 10, 28),
          baseNum('默认标题', ['font-size-title', 'default'], 10, 32),
          baseNum('大号标题', ['font-size-title', 'large'], 12, 40)
        ]
      },
      {
        key: 'font-size-main',
        title: '正文字号',
        layout: 'inline',
        fields: [
          baseNum('小号正文', ['font-size-main', 'small'], 10, 22),
          baseNum('默认正文', ['font-size-main', 'default'], 10, 24),
          baseNum('大号正文', ['font-size-main', 'large'], 10, 28)
        ]
      },
      {
        key: 'font-size-assist',
        title: '辅助字号',
        layout: 'inline',
        fields: [
          baseNum('小号辅助', ['font-size-assist', 'small'], 10, 20),
          baseNum('默认辅助', ['font-size-assist', 'default'], 10, 20),
          baseNum('大号辅助', ['font-size-assist', 'large'], 10, 24)
        ]
      }
    ]
  },
  {
    key: 'size',
    scope: 'base',
    title: '尺寸',
    description: '控制圆角、表单高度、内外间距、边框粗细与响应式断点。',
    groups: [
      {
        key: 'radius',
        title: '圆角',
        layout: 'inline',
        fields: [
          baseNum('小号圆角', ['radius', 'small'], 0, 24),
          baseNum('默认圆角', ['radius', 'default'], 0, 24),
          baseNum('大号圆角', ['radius', 'large'], 0, 32)
        ]
      },
      {
        key: 'form-height',
        title: '表单控件高度',
        layout: 'inline',
        fields: [
          baseNum('小号高度', ['form-component-height', 'small'], 16, 44),
          baseNum('默认高度', ['form-component-height', 'default'], 20, 56),
          baseNum('大号高度', ['form-component-height', 'large'], 24, 68)
        ]
      },
      {
        key: 'gap',
        title: '间距',
        layout: 'inline',
        fields: [
          baseNum('小号间距', ['gap', 'small'], 0, 24),
          baseNum('默认间距', ['gap', 'default'], 0, 28),
          baseNum('大号间距', ['gap', 'large'], 0, 36)
        ]
      },
      {
        key: 'border-width',
        title: '边框宽度',
        layout: 'inline',
        fields: [baseNum('描边粗细', ['border', 'width'], 0, 10)]
      },
      {
        key: 'breakpoint',
        title: '响应断点',
        layout: 'inline',
        fields: [
          baseNum('超小屏', ['breakpoint', 'xs'], 320, 900),
          baseNum('小屏', ['breakpoint', 'sm'], 480, 1200),
          baseNum('中屏', ['breakpoint', 'md'], 768, 1600),
          baseNum('大屏', ['breakpoint', 'lg'], 1024, 2560)
        ]
      }
    ]
  },
  {
    key: 'other',
    scope: 'base',
    title: '其它',
    description: '毛玻璃滤镜、边框线型、阴影立体感以及交互动效曲线。',
    groups: [
      {
        key: 'glass-filter',
        title: '毛玻璃滤镜',
        layout: 'glass',
        fields: [
          baseGlass('模糊强度', ['bg', 'filter', 'blur']),
          baseGlass('背景饱和度', ['bg', 'filter', 'saturate'])
        ]
      },
      {
        key: 'border-style',
        title: '边框样式',
        layout: 'inline',
        fields: [baseSegment('边框线型', ['border', 'style'], borderStyleOptions)]
      },
      {
        key: 'shadow-effect',
        title: '阴影效果',
        layout: 'inline',
        fields: [
          baseNum('水平偏移', ['shadow', 'x'], -24, 24),
          baseNum('垂直偏移', ['shadow', 'y'], -24, 24),
          baseNum('模糊半径', ['shadow', 'blur'], 0, 64),
          baseNum('扩散半径', ['shadow', 'spread'], -12, 24),
          baseSelect('低层级阴影', ['shadow', 'sm'], shadowSmOptions, { wide: true }),
          baseSelect('高层级阴影', ['shadow', 'lg'], shadowLgOptions, { wide: true }),
          baseSelect('浮雕效果', ['shadow', 'emboss'], shadowEmbossOptions, { wide: true })
        ]
      },
      {
        key: 'motion',
        title: '动效',
        layout: 'inline',
        fields: [
          baseDuration('快速过渡', ['transition', 'fast']),
          baseDuration('常规过渡', ['transition', 'normal']),
          baseDuration('慢速过渡', ['transition', 'slow']),
          baseSelect('标准缓动', ['transition', 'ease'], easingOptions),
          baseSelect('入场缓动', ['transition', 'easeOut'], easingOptions)
        ]
      }
    ]
  },

  // ─── 组件样式 ───
  {
    key: 'comp-button',
    scope: 'components',
    title: '按钮',
    description: '默认按钮、主色按钮文字及各语义浅色按钮外观。',
    groups: [
      {
        key: 'button-default',
        title: '默认按钮',
        layout: 'color',
        fields: [
          compColor('默认背景', ['button', 'default-bg']),
          compColor('默认边框', ['button', 'default-border']),
          compColor('默认文字', ['button', 'default-color']),
          compColor('悬停背景', ['button', 'default-hover-bg']),
          compColor('悬停边框', ['button', 'default-hover-border'])
        ]
      },
      {
        key: 'button-primary',
        title: '主色按钮',
        layout: 'color',
        fields: [
          compColor('实心文字色', ['button', 'primary-text-color'], {
            fallback: 'var(--u-text-color-white)'
          }),
          compColor('浅色背景', ['button', 'primary-plain-bg']),
          compColor('浅色阴影', ['button', 'primary-plain-shadow'])
        ]
      },
      {
        key: 'button-semantic-plain',
        title: '状态浅色按钮',
        layout: 'color',
        fields: [
          compColor('成功浅色背景', ['button', 'success-plain-bg']),
          compColor('成功浅色阴影', ['button', 'success-plain-shadow']),
          compColor('警告浅色背景', ['button', 'warning-plain-bg']),
          compColor('警告浅色阴影', ['button', 'warning-plain-shadow']),
          compColor('危险浅色背景', ['button', 'danger-plain-bg']),
          compColor('危险浅色阴影', ['button', 'danger-plain-shadow']),
          compColor('信息浅色背景', ['button', 'info-plain-bg']),
          compColor('信息浅色阴影', ['button', 'info-plain-shadow'])
        ]
      }
    ]
  },
  {
    key: 'comp-nav',
    scope: 'components',
    title: '导航栏',
    description: '侧栏外观模式、当前变体色彩配置以及菜单项高度与轨宽。',
    groups: [
      {
        key: 'nav-mode',
        title: '外观模式与背景图',
        layout: 'inline',
        fields: [
          compSegment('默认侧栏风格', ['nav', 'variant'], navVariantOptions),
          compSelect('背景装饰', ['nav', 'bg-image'], navBgImageOptions)
        ]
      },
      {
        key: 'nav-colors',
        title: '当前变体色彩',
        layout: 'color',
        fields: [
          compColor('侧栏底色', ['nav', 'bg-color'], { navVariant: true }),
          compColor('默认文字', ['nav', 'color'], { navVariant: true }),
          compColor('强调文字', ['nav', 'strong-color'], { navVariant: true }),
          compColor('次级文字', ['nav', 'second-color'], { navVariant: true }),
          compColor('悬停背景', ['nav', 'hover-bg'], { navVariant: true }),
          compColor('悬停文字', ['nav', 'hover-color'], { navVariant: true }),
          compColor('激活背景', ['nav', 'active-bg'], { navVariant: true }),
          compColor('激活文字', ['nav', 'active-color'], { navVariant: true }),
          compColor('子级引导线', ['nav', 'sub-border-color'], { navVariant: true }),
          compColor('轨道底色', ['nav', 'rail-bg'], { navVariant: true })
        ]
      },
      {
        key: 'nav-size',
        title: '菜单尺寸',
        layout: 'inline',
        fields: [
          compNum('小号项高', ['nav', 'height-small'], 24, 56),
          compNum('默认项高', ['nav', 'height-default'], 28, 60),
          compNum('大号项高', ['nav', 'height-large'], 32, 64),
          compNum('窄轨宽度', ['nav', 'rail-width'], 44, 96),
          compNum('带标签轨宽', ['nav', 'rail-labeled-width'], 56, 120)
        ]
      }
    ]
  },
  {
    key: 'comp-table',
    scope: 'components',
    title: '表格',
    description: '表头背景、边框颜色以及斑马纹、悬停、当前与勾选行状态。',
    groups: [
      {
        key: 'table-structure',
        title: '边框与表头',
        layout: 'color',
        fields: [
          compColor('表格边框色', ['table', 'border-color']),
          compColor('表头背景', ['table', 'header-bg']),
          compColor('表头文字', ['table', 'header-color'])
        ]
      },
      {
        key: 'table-rows',
        title: '行交互状态',
        layout: 'color',
        fields: [
          compColor('斑马纹背景', ['table', 'stripe-bg']),
          compColor('斑马纹文字', ['table', 'stripe-color']),
          compColor('悬停行背景', ['table', 'hover-bg']),
          compColor('悬停行文字', ['table', 'hover-color']),
          compColor('当前行背景', ['table', 'current-bg']),
          compColor('当前行文字', ['table', 'current-color']),
          compColor('勾选行背景', ['table', 'checked-bg']),
          compColor('勾选行文字', ['table', 'checked-color'])
        ]
      }
    ]
  },
  {
    key: 'comp-card',
    scope: 'components',
    title: '卡片',
    description: '卡片头尾底色、卡片圆角与三档内容内边距。',
    groups: [
      {
        key: 'card-surface',
        title: '表面底色',
        layout: 'color',
        fields: [
          compColor('头部背景', ['card', 'header-bg']),
          compColor('操作区背景', ['card', 'action-bg'])
        ]
      },
      {
        key: 'card-metrics',
        title: '圆角与内边距',
        layout: 'inline',
        fields: [
          compNum('卡片圆角', ['card', 'radius'], 0, 32),
          compNum('小号内边距', ['card', 'padding-small'], 0, 32),
          compNum('默认内边距', ['card', 'padding-default'], 0, 40),
          compNum('大号内边距', ['card', 'padding-large'], 0, 48)
        ]
      }
    ]
  },
  {
    key: 'comp-tag',
    scope: 'components',
    title: '标签',
    description: '各语义标签的背景、文字与边框色以及三档高度。',
    groups: [
      {
        key: 'tag-size',
        title: '标签高度',
        layout: 'inline',
        fields: [
          compNum('小号标签', ['tag', 'small'], 14, 32),
          compNum('默认标签', ['tag', 'default'], 16, 36),
          compNum('大号标签', ['tag', 'large'], 20, 44)
        ]
      },
      {
        key: 'tag-primary',
        title: '主要标签',
        layout: 'color',
        fields: [
          compColor('背景色', ['tag', 'primary-bg']),
          compColor('文字色', ['tag', 'primary-color']),
          compColor('边框色', ['tag', 'primary-border'])
        ]
      },
      {
        key: 'tag-success',
        title: '成功标签',
        layout: 'color',
        fields: [
          compColor('背景色', ['tag', 'success-bg']),
          compColor('文字色', ['tag', 'success-color']),
          compColor('边框色', ['tag', 'success-border'])
        ]
      },
      {
        key: 'tag-warning',
        title: '警告标签',
        layout: 'color',
        fields: [
          compColor('背景色', ['tag', 'warning-bg']),
          compColor('文字色', ['tag', 'warning-color']),
          compColor('边框色', ['tag', 'warning-border'])
        ]
      },
      {
        key: 'tag-danger',
        title: '危险标签',
        layout: 'color',
        fields: [
          compColor('背景色', ['tag', 'danger-bg']),
          compColor('文字色', ['tag', 'danger-color']),
          compColor('边框色', ['tag', 'danger-border'])
        ]
      },
      {
        key: 'tag-info',
        title: '信息标签',
        layout: 'color',
        fields: [
          compColor('背景色', ['tag', 'info-bg']),
          compColor('文字色', ['tag', 'info-color']),
          compColor('边框色', ['tag', 'info-border'])
        ]
      }
    ]
  },
  {
    key: 'comp-alert',
    scope: 'components',
    title: '警告提示',
    description: '信息、成功、警告、错误四类提示条的背景、边框与文字色。',
    groups: [
      {
        key: 'alert-info',
        title: '信息提示',
        layout: 'color',
        fields: [
          compColor('背景色', ['alert', 'info-bg']),
          compColor('文字色', ['alert', 'info-color']),
          compColor('边框色', ['alert', 'info-border'])
        ]
      },
      {
        key: 'alert-success',
        title: '成功提示',
        layout: 'color',
        fields: [
          compColor('背景色', ['alert', 'success-bg']),
          compColor('文字色', ['alert', 'success-color']),
          compColor('边框色', ['alert', 'success-border'])
        ]
      },
      {
        key: 'alert-warning',
        title: '警告提示',
        layout: 'color',
        fields: [
          compColor('背景色', ['alert', 'warning-bg']),
          compColor('文字色', ['alert', 'warning-color']),
          compColor('边框色', ['alert', 'warning-border'])
        ]
      },
      {
        key: 'alert-error',
        title: '错误提示',
        layout: 'color',
        fields: [
          compColor('背景色', ['alert', 'error-bg']),
          compColor('文字色', ['alert', 'error-color']),
          compColor('边框色', ['alert', 'error-border'])
        ]
      }
    ]
  },
  {
    key: 'comp-select',
    scope: 'components',
    title: '选择与菜单',
    description: '下拉选择、自动补全、级联选择与右键菜单选项的交互色彩与尺寸。',
    groups: [
      {
        key: 'select-options',
        title: '下拉选择',
        layout: 'color',
        fields: [
          compColor('悬停背景', ['select', 'option-hover-bg']),
          compColor('悬停文字', ['select', 'option-hover-color']),
          compColor('选中背景', ['select', 'option-selected-bg']),
          compColor('选中文字', ['select', 'option-selected-color'])
        ]
      },
      {
        key: 'autocomplete-options',
        title: '自动补全',
        layout: 'color',
        fields: [
          compColor('悬停背景', ['auto-complete', 'option-hover-bg']),
          compColor('悬停文字', ['auto-complete', 'option-hover-color']),
          compColor('选中背景', ['auto-complete', 'option-selected-bg']),
          compColor('选中文字', ['auto-complete', 'option-selected-color'])
        ]
      },
      {
        key: 'cascade-options',
        title: '级联选择',
        layout: 'color',
        fields: [
          compColor('激活项背景', ['cascade', 'node-active-bg']),
          compColor('激活项文字', ['cascade', 'node-active-color'])
        ]
      },
      {
        key: 'contextmenu-options',
        title: '右键菜单',
        layout: 'color',
        fields: [
          compColor('悬停背景', ['contextmenu', 'item-hover-bg']),
          compColor('悬停文字', ['contextmenu', 'item-hover-color'])
        ]
      },
      {
        key: 'contextmenu-heights',
        title: '右键菜单项高度',
        layout: 'inline',
        fields: [
          compNum('小号高度', ['contextmenu', 'item-height-small'], 18, 40),
          compNum('默认高度', ['contextmenu', 'item-height-default'], 20, 44),
          compNum('大号高度', ['contextmenu', 'item-height-large'], 24, 48)
        ]
      }
    ]
  },
  {
    key: 'comp-form',
    scope: 'components',
    title: '表单控件',
    description: '开关尺寸、单选多选边框、评分亮色与文件选择/表达式扩展样式。',
    groups: [
      {
        key: 'switch-size',
        title: '开关高度',
        layout: 'inline',
        fields: [
          compNum('小号开关', ['switch', 'height-small'], 14, 28),
          compNum('默认开关', ['switch', 'height-default'], 16, 32),
          compNum('大号开关', ['switch', 'height-large'], 18, 36)
        ]
      },
      {
        key: 'radio-checkbox',
        title: '单选与多选',
        layout: 'color',
        fields: [
          compColor('单选边框', ['radio', 'border'], {
            fallback: '#cccccc',
            darkFallback: '#595959'
          }),
          compColor('多选边框', ['checkbox', 'border'], {
            fallback: 'var(--u-text-color-assist)',
            darkFallback: '#595959'
          }),
          compColor('多选勾选色', ['checkbox', 'color'], { fallback: '#ffffff' })
        ]
      },
      {
        key: 'rate-extra',
        title: '评分与扩展输入',
        layout: 'color',
        fields: [
          compColor('评分高亮色', ['rate', 'active-color'], { fallback: 'var(--u-color-warning)' }),
          compColor('文件选择悬停', ['file-picker', 'hover-bg']),
          compColor('表达式标签背景', ['expression-editor', 'chip-bg']),
          compColor('表达式标签文字', ['expression-editor', 'chip-color'])
        ]
      }
    ]
  },
  {
    key: 'comp-navigation',
    scope: 'components',
    title: '页签与导览',
    description: '标签页、树形控件、分页器、面包屑与步骤条的交互视觉配置。',
    groups: [
      {
        key: 'tabs-colors',
        title: '标签页',
        layout: 'color',
        fields: [
          compColor('标签栏底色', ['tabs', 'bar-bg']),
          compColor('激活项背景', ['tabs', 'active-bg'])
        ]
      },
      {
        key: 'tree-colors',
        title: '树形控件',
        layout: 'color',
        fields: [
          compColor('选中节点背景', ['tree', 'node-selected-bg']),
          compColor('选中节点文字', ['tree', 'node-selected-color'])
        ]
      },
      {
        key: 'paginator-colors',
        title: '分页器',
        layout: 'color',
        fields: [
          compColor('按钮悬停背景', ['paginator', 'btn-hover-bg']),
          compColor('按钮悬停文字', ['paginator', 'btn-hover-color']),
          compColor('当前页背景', ['paginator', 'btn-active-bg']),
          compColor('当前页文字', ['paginator', 'btn-active-color'])
        ]
      },
      {
        key: 'breadcrumb-size',
        title: '面包屑高度',
        layout: 'inline',
        fields: [
          compNum('小号高度', ['breadcrumb', 'small'], 16, 36),
          compNum('默认高度', ['breadcrumb', 'default'], 18, 40),
          compNum('大号高度', ['breadcrumb', 'large'], 20, 44)
        ]
      },
      {
        key: 'steps-finished',
        title: '步骤条完成态',
        layout: 'color',
        fields: [
          compColor('已完成图标色', ['steps', 'finished-color'], {
            fallback: 'var(--u-color-primary)',
            darkFallback: 'var(--u-text-color-white)'
          }),
          compColor('主要完成底色', ['steps', 'primary-finished-bg'], {
            fallback: 'var(--u-color-primary-light-7)',
            darkFallback: 'var(--u-color-primary)'
          }),
          compColor('成功完成底色', ['steps', 'success-finished-bg'], {
            fallback: 'var(--u-color-success-light-7)',
            darkFallback: 'var(--u-color-success)'
          }),
          compColor('警告完成底色', ['steps', 'warning-finished-bg'], {
            fallback: 'var(--u-color-warning-light-7)',
            darkFallback: 'var(--u-color-warning)'
          }),
          compColor('危险完成底色', ['steps', 'danger-finished-bg'], {
            fallback: 'var(--u-color-danger-light-7)',
            darkFallback: 'var(--u-color-danger)'
          }),
          compColor('信息完成底色', ['steps', 'info-finished-bg'], {
            fallback: 'var(--u-color-info-light-7)',
            darkFallback: 'var(--u-color-info)'
          })
        ]
      }
    ]
  },
  {
    key: 'comp-misc',
    scope: 'components',
    title: '浮层与细节',
    description: '抽屉默认宽度、聚焦光晕以及快捷键/批量编辑表面修饰。',
    groups: [
      {
        key: 'drawer-size',
        title: '抽屉尺寸',
        layout: 'inline',
        fields: [compNum('默认宽度/高度', ['drawer', 'size'], 200, 960, { step: 10 })]
      },
      {
        key: 'focus-rings',
        title: '焦点光晕',
        layout: 'inline',
        fields: [
          compFocusRing('默认聚焦光晕', ['focus-ring'], 'primary'),
          compFocusRing('错误态光晕', ['focus-ring-danger'], 'danger')
        ]
      },
      {
        key: 'misc-surfaces',
        title: '快捷键与批量编辑',
        layout: 'color',
        fields: [
          compColor('批量表单头背景', ['batch-edit', 'form-header-bg'], {
            fallback: 'var(--u-bg-color-top)'
          }),
          compColor('按键内阴影色', ['kbd', 'inset-shadow'], {
            fallback: 'var(--u-bg-color-middle)'
          }),
          compColor('按键边框阴影', ['kbd', 'border-shadow'], {
            fallback: 'var(--u-border-color)'
          }),
          compColor('按键底阴影色', ['kbd', 'drop-shadow'], { fallback: 'rgba(0, 0, 0, 0.6)' })
        ]
      }
    ]
  }
]

export function getSectionFields(section: ThemeSection): ThemeField[] {
  return section.groups.flatMap((group) => group.fields)
}

export const ALL_THEME_FIELDS: ThemeField[] = THEME_SECTIONS.flatMap(getSectionFields)
