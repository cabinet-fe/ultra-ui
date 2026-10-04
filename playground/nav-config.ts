import type { NavItem } from '@veltra/desktop'
import { AiChat, FormTable, Layers, Mobile, Monitor, PictureRounded } from '@veltra/icons/normal'
import type { DefineComponent } from 'vue'

export type DemoCategory =
  | 'basic'
  | 'layout'
  | 'nav'
  | 'form'
  | 'data'
  | 'feedback'
  | 'editor'
  | 'other'
  | 'mobile'

export interface DemoMeta {
  zh: string
  en: string
  category: DemoCategory
}

export const categories: { key: DemoCategory; zh: string }[] = [
  { key: 'basic', zh: '基础' },
  { key: 'layout', zh: '布局' },
  { key: 'nav', zh: '导航' },
  { key: 'form', zh: '表单' },
  { key: 'data', zh: '数据展示' },
  { key: 'feedback', zh: '反馈' },
  { key: 'editor', zh: '编辑器' },
  { key: 'other', zh: '其他' }
]

/** 默认首页路由 */
export const DEFAULT_ROUTE = '/desktop/button/index'

const DESKTOP_ROOT = '/desktop'
const MOBILE_ROOT = '/mobile'

/** mobile demo key 前缀（router.ts 按目录名生成 `mobile-<name>`，路由 path 仍是 `/mobile/<name>/index`） */
const MOBILE_KEY_PREFIX = 'mobile-'

export const demoMeta: Record<string, DemoMeta> = {
  icons: { zh: '图标', en: 'Icons', category: 'other' },
  action: { zh: '操作按钮', en: 'Action', category: 'other' },
  'ai-chat': { zh: 'AI 对话', en: 'AiChat', category: 'data' },
  sheet: { zh: '电子表格', en: 'Sheet', category: 'data' },
  'sheet-big-data': { zh: '大数据量演示', en: 'BigData', category: 'data' },
  'sheet-data-entry': { zh: '在线填报', en: 'DataEntry', category: 'data' },
  'smart-table': { zh: '智慧表格', en: 'SmartTable', category: 'data' },
  anchor: { zh: '锚点导航', en: 'Anchor', category: 'nav' },
  alert: { zh: '警告提示', en: 'Alert', category: 'feedback' },
  'auto-complete': { zh: '自动补全', en: 'AutoComplete', category: 'form' },
  avatar: { zh: '头像', en: 'Avatar', category: 'basic' },
  'back-top': { zh: '回到顶部', en: 'BackTop', category: 'basic' },
  badge: { zh: '徽标', en: 'Badge', category: 'basic' },
  'batch-edit': { zh: '批量编辑', en: 'BatchEdit', category: 'other' },
  breadcrumb: { zh: '面包屑', en: 'Breadcrumb', category: 'nav' },
  button: { zh: '按钮', en: 'Button', category: 'basic' },
  calendar: { zh: '日历', en: 'Calendar', category: 'data' },
  card: { zh: '卡片', en: 'Card', category: 'layout' },
  carousel: { zh: '走马灯', en: 'Carousel', category: 'data' },
  cascade: { zh: '级联选择器', en: 'Cascade', category: 'form' },
  checkbox: { zh: '复选框', en: 'Checkbox', category: 'form' },
  'code-editor': { zh: '代码编辑器', en: 'CodeEditor', category: 'editor' },
  collapse: { zh: '折叠面板', en: 'Collapse', category: 'layout' },
  'condition-editor': { zh: '条件编辑器', en: 'ConditionEditor', category: 'editor' },
  contextmenu: { zh: '右键菜单', en: 'Contextmenu', category: 'nav' },
  'date-picker': { zh: '日期选择器', en: 'DatePicker', category: 'form' },
  'date-range-picker': { zh: '日期范围选择器', en: 'DateRangePicker', category: 'form' },
  descriptions: { zh: '描述列表', en: 'Descriptions', category: 'data' },
  dialog: { zh: '对话框', en: 'Dialog', category: 'feedback' },
  divider: { zh: '分割线', en: 'Divider', category: 'basic' },
  dnd: { zh: '拖拽排序', en: 'DnD', category: 'other' },
  drawer: { zh: '抽屉', en: 'Drawer', category: 'feedback' },
  dropdown: { zh: '下拉菜单', en: 'Dropdown', category: 'nav' },
  'dual-nav': { zh: '双栏导航', en: 'DualNav', category: 'nav' },
  empty: { zh: '空状态', en: 'Empty', category: 'basic' },
  'expression-editor': { zh: '表达式编辑器', en: 'ExpressionEditor', category: 'editor' },
  'file-picker': { zh: '文件选择器', en: 'FilePicker', category: 'other' },
  'file-viewer': { zh: '文件查看器', en: 'FileViewer', category: 'other' },
  'float-button': { zh: '浮动按钮', en: 'FloatButton', category: 'basic' },
  form: { zh: '表单容器', en: 'Form', category: 'form' },
  grid: { zh: '栅格布局', en: 'Grid', category: 'layout' },
  'grid-input': { zh: '网格输入框', en: 'GridInput', category: 'form' },
  'group-input': { zh: '分组输入', en: 'GroupInput', category: 'form' },
  'group-nav': { zh: '分组导航', en: 'GroupNav', category: 'nav' },
  icon: { zh: '图标容器', en: 'Icon', category: 'basic' },
  'image-cropper': { zh: '图片裁剪', en: 'ImageCropper', category: 'other' },
  input: { zh: '输入框', en: 'Input', category: 'form' },
  kanban: { zh: '看板', en: 'Kanban', category: 'data' },
  kbd: { zh: '键盘', en: 'Kbd', category: 'basic' },
  layout: { zh: '布局', en: 'Layout', category: 'layout' },
  list: { zh: '列表', en: 'List', category: 'layout' },
  loading: { zh: '加载', en: 'Loading', category: 'feedback' },
  message: { zh: '消息提示', en: 'Message', category: 'feedback' },
  'message-confirm': { zh: '消息确认', en: 'MessageConfirm', category: 'feedback' },
  'mobile-avatar': { zh: '头像', en: 'Avatar', category: 'mobile' },
  'mobile-badge': { zh: '徽标', en: 'Badge', category: 'mobile' },
  'mobile-button': { zh: '按钮', en: 'Button', category: 'mobile' },
  'mobile-card': { zh: '卡片', en: 'Card', category: 'mobile' },
  'mobile-check-tag': { zh: '可选标签', en: 'CheckTag', category: 'mobile' },
  'mobile-checkbox': { zh: '复选框', en: 'Checkbox', category: 'mobile' },
  'mobile-checkbox-group': { zh: '复选框组', en: 'CheckboxGroup', category: 'mobile' },
  'mobile-collapse': { zh: '折叠面板', en: 'Collapse', category: 'mobile' },
  'mobile-date-picker': { zh: '日期选择器', en: 'DatePicker', category: 'mobile' },
  'mobile-descriptions': { zh: '描述列表', en: 'Descriptions', category: 'mobile' },
  'mobile-dialog': { zh: '对话框', en: 'Dialog', category: 'mobile' },
  'mobile-divider': { zh: '分割线', en: 'Divider', category: 'mobile' },
  'mobile-drawer': { zh: '抽屉', en: 'Drawer', category: 'mobile' },
  'mobile-empty': { zh: '空状态', en: 'Empty', category: 'mobile' },
  'mobile-form': { zh: '表单容器', en: 'Form', category: 'mobile' },
  'mobile-form-item': { zh: '表单项', en: 'FormItem', category: 'mobile' },
  'mobile-icon': { zh: '图标容器', en: 'Icon', category: 'mobile' },
  'mobile-input': { zh: '输入框', en: 'Input', category: 'mobile' },
  'mobile-list': { zh: '列表', en: 'List', category: 'mobile' },
  'mobile-loading': { zh: '加载', en: 'Loading', category: 'mobile' },
  'mobile-message': { zh: '消息提示', en: 'Message', category: 'mobile' },
  'mobile-message-confirm': { zh: '消息确认', en: 'MessageConfirm', category: 'mobile' },
  'mobile-multi-select': { zh: '多选选择器', en: 'MultiSelect', category: 'mobile' },
  'mobile-number-input': { zh: '数字输入框', en: 'NumberInput', category: 'mobile' },
  'mobile-password-input': { zh: '密码输入框', en: 'PasswordInput', category: 'mobile' },
  'mobile-progress': { zh: '进度条', en: 'Progress', category: 'mobile' },
  'mobile-radio': { zh: '单选框', en: 'Radio', category: 'mobile' },
  'mobile-radio-group': { zh: '单选框组', en: 'RadioGroup', category: 'mobile' },
  'mobile-segment': { zh: '分段选择', en: 'Segment', category: 'mobile' },
  'mobile-select': { zh: '选择器', en: 'Select', category: 'mobile' },
  'mobile-skeleton': { zh: '骨架屏', en: 'Skeleton', category: 'mobile' },
  'mobile-space': { zh: '间距容器', en: 'Space', category: 'mobile' },
  'mobile-steps': { zh: '步骤条', en: 'Steps', category: 'mobile' },
  'mobile-switch': { zh: '开关', en: 'Switch', category: 'mobile' },
  'mobile-tabs': { zh: '标签页', en: 'Tabs', category: 'mobile' },
  'mobile-tag': { zh: '标签', en: 'Tag', category: 'mobile' },
  'mobile-text': { zh: '文本', en: 'Text', category: 'mobile' },
  'mobile-textarea': { zh: '文本域', en: 'Textarea', category: 'mobile' },
  'mobile-time-picker': { zh: '时间选择器', en: 'TimePicker', category: 'mobile' },
  'mobile-timeline': { zh: '时间线', en: 'Timeline', category: 'mobile' },
  'multi-select': { zh: '多选选择器', en: 'MultiSelect', category: 'form' },
  'multi-tree-select': { zh: '多选树形选择器', en: 'MultiTreeSelect', category: 'form' },
  nav: { zh: '导航', en: 'Nav', category: 'nav' },
  notification: { zh: '通知', en: 'Notification', category: 'feedback' },
  number: { zh: '数字展示', en: 'Number', category: 'basic' },
  'number-input': { zh: '数字输入框', en: 'NumberInput', category: 'form' },
  'number-range-input': { zh: '数字范围输入框', en: 'NumberRangeInput', category: 'form' },
  paginator: { zh: '分页器', en: 'Paginator', category: 'data' },
  palette: { zh: '调色板', en: 'Palette', category: 'data' },
  'password-input': { zh: '密码输入框', en: 'PasswordInput', category: 'form' },
  'pop-confirm': { zh: '气泡确认框', en: 'PopConfirm', category: 'feedback' },
  progress: { zh: '进度条', en: 'Progress', category: 'data' },
  'progress-nodes': { zh: '进度节点', en: 'ProgressNodes', category: 'data' },
  radio: { zh: '单选框', en: 'Radio', category: 'form' },
  rate: { zh: '评分', en: 'Rate', category: 'form' },
  scroll: { zh: '滚动容器', en: 'Scroll', category: 'basic' },
  segment: { zh: '分段选择', en: 'Segment', category: 'form' },
  select: { zh: '单选选择器', en: 'Select', category: 'form' },
  showcase: { zh: '综合展示', en: 'Showcase', category: 'other' },
  skeleton: { zh: '骨架屏', en: 'Skeleton', category: 'feedback' },
  slider: { zh: '滑块', en: 'Slider', category: 'form' },
  space: { zh: '间距容器', en: 'Space', category: 'layout' },
  steps: { zh: '步骤条', en: 'Steps', category: 'nav' },
  switch: { zh: '开关', en: 'Switch', category: 'form' },
  table: { zh: '表格', en: 'Table', category: 'data' },
  'table-editor': { zh: '表格编辑器', en: 'TableEditor', category: 'data' },
  tabs: { zh: '标签页', en: 'Tabs', category: 'nav' },
  tag: { zh: '标签', en: 'Tag', category: 'basic' },
  text: { zh: '文本', en: 'Text', category: 'basic' },
  'text-editor': { zh: '富文本编辑器', en: 'TextEditor', category: 'editor' },
  textarea: { zh: '文本域', en: 'Textarea', category: 'form' },
  theme: { zh: '主题编辑器', en: 'Theme', category: 'other' },
  'time-picker': { zh: '时间选择器', en: 'TimePicker', category: 'form' },
  timeline: { zh: '时间线', en: 'Timeline', category: 'data' },
  tip: { zh: '提示', en: 'Tip', category: 'feedback' },
  transfer: { zh: '穿梭框', en: 'Transfer', category: 'form' },
  tree: { zh: '树形控件', en: 'Tree', category: 'data' },
  'tree-select': { zh: '树形选择器', en: 'TreeSelect', category: 'form' },
  watermark: { zh: '水印', en: 'Watermark', category: 'other' }
}

/** 顶层独立入口（不挂在 Desktop 分类下） */
const TOP_LEVEL_DEMO_KEYS = new Set([
  'icons',
  'ai-chat',
  'sheet',
  'sheet-big-data',
  'sheet-data-entry',
  'smart-table'
])

const ICONS_ROOT = '/icons'

function demosInCategory(category: DemoCategory) {
  return Object.entries(demoMeta)
    .filter(([key, meta]) => !TOP_LEVEL_DEMO_KEYS.has(key) && meta.category === category)
    .map(([key, meta]) => ({ key, zh: meta.zh, en: meta.en }))
    .sort((a, b) => a.zh.localeCompare(b.zh, 'zh-CN'))
}

/** Mobile 分区叶子项：key（`mobile-<name>`）转回路由 path `/mobile/<name>/index` */
function mobileDemos() {
  return demosInCategory('mobile').map((d) => ({
    title: `${d.zh} ${d.en}`,
    path: `${MOBILE_ROOT}/${d.key.slice(MOBILE_KEY_PREFIX.length)}/index`
  }))
}

export function buildPlaygroundMenus(): NavItem[] {
  return [
    {
      title: 'Icons 图标',
      description: '浏览 @veltra/icons 图标库，支持搜索、分组与图标组合预览',
      icon: PictureRounded as DefineComponent,
      path: ICONS_ROOT,
      children: [
        { title: '图标库', path: '/icons/index' },
        { title: '图标组合', path: '/icons/combo/index' }
      ]
    },
    {
      title: 'Desktop 组件',
      description: '按分类浏览桌面端组件演示，预览交互效果与主题样式',
      icon: Monitor as DefineComponent,
      path: DESKTOP_ROOT,
      children: categories.map((cat) => ({
        title: cat.zh,
        path: `${DESKTOP_ROOT}/${cat.key}`,
        children: demosInCategory(cat.key).map((d) => ({
          title: `${d.zh} ${d.en}`,
          path: `${DESKTOP_ROOT}/${d.key}/index`
        }))
      }))
    },
    {
      title: 'Mobile 组件',
      description: '按移动端密度与触控热区浏览 @veltra/mobile 组件演示（375px 视口适配）',
      icon: Mobile as DefineComponent,
      path: MOBILE_ROOT,
      children: mobileDemos()
    },
    {
      title: 'AI Chat',
      description: '预览 @veltra/ai 对话组件，经 Node 代理接入 DeepSeek V4 Flash / V4 Pro',
      icon: AiChat as DefineComponent,
      path: '/ai-chat',
      children: [{ title: 'AI 对话', path: '/ai-chat/index' }]
    },
    {
      title: 'Sheet 电子表格',
      description: '预览 @veltra/sheet 电子表格（引擎渲染，自持有数据模型）',
      icon: FormTable as DefineComponent,
      path: '/sheet',
      children: [
        { title: '基础演示', path: '/sheet/index' },
        { title: '大数据量演示', path: '/sheet-big-data/index' },
        { title: '在线填报', path: '/sheet-data-entry/index' }
      ]
    },
    {
      title: 'Smart Table 智慧表格',
      description:
        '多维表格示例：9 种类型化字段行内编辑、工具栏视图管线、AI 字段回填、AI 对话答疑与演示表持久化',
      icon: Layers as DefineComponent,
      path: '/smart-table',
      children: [{ title: '智慧表格', path: '/smart-table/index' }]
    }
  ]
}

/** 分组导航路径（非叶子页），不应触发 router 跳转 */
export function isNavGroupPath(path: string): boolean {
  if (
    path === DESKTOP_ROOT ||
    path === ICONS_ROOT ||
    path === MOBILE_ROOT ||
    path === '/sheet' ||
    path === '/ai-chat' ||
    path === '/smart-table'
  ) {
    return true
  }
  if (path.startsWith(`${DESKTOP_ROOT}/`) && !path.endsWith('/index')) return true
  if (path.startsWith(`${MOBILE_ROOT}/`) && !path.endsWith('/index')) return true
  return false
}

/** 扁平化后的可搜索导航项 */
export interface NavSearchItem {
  path: string
  title: string
  /** 顶层分区，如 Icons / Desktop / AI Chat */
  section: string
  /** Desktop 分类名，如「基础」 */
  category?: string
}

/** 将双栏导航树扁平化为可搜索叶子项 */
export function flattenPlaygroundNavItems(menus: NavItem[]): NavSearchItem[] {
  const items: NavSearchItem[] = []

  function walk(nodes: NavItem[], ancestors: NavItem[]) {
    for (const node of nodes) {
      const trail = [...ancestors, node]
      if (!isNavGroupPath(node.path)) {
        items.push({
          path: node.path,
          title: node.title,
          section: trail[0]?.title ?? node.title,
          category: trail.length >= 3 ? trail[1]?.title : undefined
        })
      }
      if (node.children?.length) {
        walk(node.children, trail)
      }
    }
  }

  walk(menus, [])
  return items
}

/** 标题高亮区间：命中片段在标题中的字符偏移，左闭右开 */
export interface NavTitleRange {
  start: number
  end: number
}

/** 搜索结果选项：导航项附带标题命中区间，供面板渲染强调片段 */
export interface NavSearchResultItem extends NavSearchItem {
  /** 所有 token 的命中偏移，重叠区间已合并、按 start 升序 */
  titleRanges: NavTitleRange[]
}

/** 搜索结果分组：顶层分区 + 组内结果项 */
export interface NavSearchGroup {
  section: string
  items: NavSearchResultItem[]
}

/** 查询分词：小写化并按空白切分 */
function tokenizeQuery(query?: string): string[] {
  return (query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** 计算 token 在标题（已小写）中的全部命中区间，重叠区间合并 */
function titleHitRanges(lowerTitle: string, tokens: string[]): NavTitleRange[] {
  const ranges: NavTitleRange[] = []
  for (const token of tokens) {
    let start = lowerTitle.indexOf(token)
    while (start !== -1) {
      ranges.push({ start, end: start + token.length })
      start = lowerTitle.indexOf(token, start + token.length)
    }
  }

  ranges.sort((a, b) => a.start - b.start)
  const merged: NavTitleRange[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end)
    else merged.push(range)
  }
  return merged
}

/** 单项匹配：token 间 AND、字段（title/section/category/path）间 OR、不区分大小写；空 token 视为全量命中 */
function matchNavItem(item: NavSearchItem, tokens: string[]): NavSearchResultItem | null {
  if (!tokens.length) return { ...item, titleRanges: [] }

  const lowerTitle = item.title.toLowerCase()
  const fields = [item.title, item.section, item.category, item.path]
    .filter((field): field is string => Boolean(field))
    .map((field) => field.toLowerCase())
  if (!tokens.every((token) => fields.some((field) => field.includes(token)))) return null

  return { ...item, titleRanges: titleHitRanges(lowerTitle, tokens) }
}

/** 组内排序权重：标题直接命中为 0，仅分类/分区/路径命中为 1 */
function titleWeight(item: NavSearchResultItem): number {
  return item.titleRanges.length ? 0 : 1
}

/**
 * 导航搜索主函数。空查询返回全量分组（保持扁平化产出的分区顺序）；
 * 有查询时 token 间 AND 匹配，组内标题直接命中的项排在仅分类/分区/路径命中的项之前
 * （sort 稳定，同级保持原序），并为每项计算标题高亮区间。
 */
export function searchNavItems(items: NavSearchItem[], query?: string): NavSearchGroup[] {
  const tokens = tokenizeQuery(query)
  const groups = new Map<string, NavSearchResultItem[]>()

  for (const item of items) {
    const result = matchNavItem(item, tokens)
    if (!result) continue
    const bucket = groups.get(result.section)
    if (bucket) bucket.push(result)
    else groups.set(result.section, [result])
  }

  return [...groups.entries()].map(([section, groupItems]) => ({
    section,
    items: groupItems.sort((a, b) => titleWeight(a) - titleWeight(b))
  }))
}
