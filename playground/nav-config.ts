import type { NavItem } from '@veltra/desktop'
import { AiChat, FormTable, Monitor, PictureRounded } from '@veltra/icons/normal'
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

export const demoMeta: Record<string, DemoMeta> = {
  icons: { zh: '图标', en: 'Icons', category: 'other' },
  action: { zh: '操作按钮', en: 'Action', category: 'other' },
  'ai-chat': { zh: 'AI 对话', en: 'AiChat', category: 'data' },
  sheet: { zh: '电子表格', en: 'Sheet', category: 'data' },
  'sheet-big-data': { zh: '大数据量演示', en: 'BigData', category: 'data' },
  'auto-complete': { zh: '自动补全', en: 'AutoComplete', category: 'form' },
  badge: { zh: '徽标', en: 'Badge', category: 'basic' },
  'batch-edit': { zh: '批量编辑', en: 'BatchEdit', category: 'other' },
  breadcrumb: { zh: '面包屑', en: 'Breadcrumb', category: 'nav' },
  button: { zh: '按钮', en: 'Button', category: 'basic' },
  calendar: { zh: '日历', en: 'Calendar', category: 'data' },
  card: { zh: '卡片', en: 'Card', category: 'layout' },
  cascade: { zh: '级联选择器', en: 'Cascade', category: 'form' },
  checkbox: { zh: '复选框', en: 'Checkbox', category: 'form' },
  'code-editor': { zh: '代码编辑器', en: 'CodeEditor', category: 'editor' },
  collapse: { zh: '折叠面板', en: 'Collapse', category: 'layout' },
  'condition-editor': { zh: '条件编辑器', en: 'ConditionEditor', category: 'editor' },
  contextmenu: { zh: '右键菜单', en: 'Contextmenu', category: 'nav' },
  'date-picker': { zh: '日期选择器', en: 'DatePicker', category: 'form' },
  'date-range-picker': { zh: '日期范围选择器', en: 'DateRangePicker', category: 'form' },
  dialog: { zh: '对话框', en: 'Dialog', category: 'feedback' },
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
  input: { zh: '输入框', en: 'Input', category: 'form' },
  kbd: { zh: '键盘', en: 'Kbd', category: 'basic' },
  layout: { zh: '布局', en: 'Layout', category: 'layout' },
  list: { zh: '列表', en: 'List', category: 'layout' },
  loading: { zh: '加载', en: 'Loading', category: 'feedback' },
  message: { zh: '消息提示', en: 'Message', category: 'feedback' },
  'message-confirm': { zh: '消息确认', en: 'MessageConfirm', category: 'feedback' },
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
  scroll: { zh: '滚动容器', en: 'Scroll', category: 'basic' },
  select: { zh: '单选选择器', en: 'Select', category: 'form' },
  showcase: { zh: '综合展示', en: 'Showcase', category: 'other' },
  slider: { zh: '滑块', en: 'Slider', category: 'form' },
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
  tip: { zh: '提示', en: 'Tip', category: 'feedback' },
  tree: { zh: '树形控件', en: 'Tree', category: 'data' },
  'tree-select': { zh: '树形选择器', en: 'TreeSelect', category: 'form' },
  watermark: { zh: '水印', en: 'Watermark', category: 'other' }
}

/** 顶层独立入口（不挂在 Desktop 分类下） */
const TOP_LEVEL_DEMO_KEYS = new Set(['icons', 'ai-chat', 'sheet', 'sheet-big-data'])

const ICONS_ROOT = '/icons'

function demosInCategory(category: DemoCategory) {
  return Object.entries(demoMeta)
    .filter(([key, meta]) => !TOP_LEVEL_DEMO_KEYS.has(key) && meta.category === category)
    .map(([key, meta]) => ({ key, zh: meta.zh, en: meta.en }))
    .sort((a, b) => a.zh.localeCompare(b.zh, 'zh-CN'))
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
      title: 'AI Chat',
      description: '预览 @veltra/ai 对话组件，含工具调用与 mock transport',
      icon: AiChat as DefineComponent,
      path: '/ai-chat/index'
    },
    {
      title: 'Sheet 电子表格',
      description: '预览 @veltra/sheet 电子表格（VTable 渲染，自持有数据模型）',
      icon: FormTable as DefineComponent,
      path: '/sheet',
      children: [
        { title: '基础演示', path: '/sheet/index' },
        { title: '大数据量演示', path: '/sheet-big-data/index' }
      ]
    }
  ]
}

/** 分组导航路径（非叶子页），不应触发 router 跳转 */
export function isNavGroupPath(path: string): boolean {
  if (path === DESKTOP_ROOT || path === ICONS_ROOT || path === '/sheet') return true
  if (path.startsWith(`${DESKTOP_ROOT}/`) && !path.endsWith('/index')) return true
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

/** 按关键字过滤导航项（支持中英文与路径片段） */
export function filterNavSearchItems(items: NavSearchItem[], query?: string, limit = 30) {
  const q = query?.trim().toLowerCase()
  if (!q) return items.slice(0, limit)

  const tokens = q.split(/\s+/).filter(Boolean)

  return items
    .filter((item) => {
      const haystack = [item.title, item.section, item.category, item.path]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })
    .slice(0, limit)
}
