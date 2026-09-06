import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** 组件技能文档：伴生工具（仅列需手动 import 的 API） */
export type ComponentSkillHelper = { name: string; purpose: string; importLine: string }

export const HELPERS_BY_KEBAB: Record<string, ComponentSkillHelper[]> = {
  'batch-edit': [
    {
      name: 'defineTableColumns',
      purpose: '与 UTable 相同，为左侧表格列批量设置公共列属性。',
      importLine: "import { defineTableColumns } from '@veltra/desktop'"
    }
  ],
  'condition-editor': [
    {
      name: 'evaluateConditionExpression',
      purpose: '对条件表达式 JSON 求值，与编辑器 UI 解耦的纯函数。',
      importLine: "import { evaluateConditionExpression } from '@veltra/desktop'"
    },
    {
      name: 'createEmptyGroup / createEmptyLeaf',
      purpose: '创建空的条件分组或叶子节点。',
      importLine: "import { createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'"
    }
  ],
  contextmenu: [
    {
      name: 'contextmenu',
      purpose: '在鼠标位置弹出右键菜单（函数式 API）。',
      importLine: "import { contextmenu } from '@veltra/desktop'"
    }
  ],
  form: [],
  loading: [
    {
      name: 'vLoading',
      purpose: '在目标元素上显示加载遮罩指令。',
      importLine: "import { vLoading } from '@veltra/desktop'"
    }
  ],
  message: [
    {
      name: 'message',
      purpose: '函数式全局消息（`success` / `info` / `warn` / `error` 等快捷方法）。',
      importLine: "import { message } from '@veltra/desktop'"
    }
  ],
  'message-confirm': [
    {
      name: 'messageConfirm',
      purpose:
        '函数式确认框；另有 `primary` / `success` / `info` / `warning` / `danger` 快捷方法与 `closeAll()`。',
      importLine: "import { messageConfirm } from '@veltra/desktop'"
    }
  ],
  notification: [
    {
      name: 'notification',
      purpose:
        '函数式通知条；另有 `primary` / `success` / `info` / `warning` / `danger` 快捷方法与按方位 `closeAll(position?)`。',
      importLine: "import { notification } from '@veltra/desktop'"
    }
  ],
  table: [
    {
      name: 'defineTableColumns',
      purpose: '为列树批量合并 `align`、`minWidth` 等公共属性（DFS，不覆盖列上已有值）。',
      importLine: "import { defineTableColumns } from '@veltra/desktop'"
    }
  ],
  'ai-chat': [
    {
      name: 'useChat',
      purpose: '与 UI 解耦的对话状态机；`UAiChat` 内部即用它，无头场景直接调用。',
      importLine: "import { useChat } from '@veltra/ai'"
    },
    {
      name: 'createOpenAITransport',
      purpose: 'OpenAI 兼容 SSE transport；按 `request.model` 选择 Provider。',
      importLine: "import { createOpenAITransport } from '@veltra/ai'"
    }
  ],
  sheet: [
    {
      name: 'registerTool',
      purpose: '向工具栏注册自定义工具；与 `USheet` 共用同一注册表。',
      importLine: "import { registerTool } from '@veltra/sheet'"
    }
  ]
}

/** nav 系列组件共享的外观备注 */
const THEME_NAV_NOTE =
  "外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见主题文档「侧栏导航外观」。"

/** 组件技能文档：附加备注（渲染为 api.md 的「备注」一节，内容手工维护） */
export const NOTES_BY_KEBAB: Record<string, string> = {
  'code-editor':
    '语言标识与放大按钮在编辑区之外的顶部工具栏：`langs` 多于一种时显示语言选择器，仅一种时显示语言名称标签。`zoomable`（默认 `true`）为 `false` 时不渲染放大按钮。放大复用同一编辑器实例（Teleport 到屏幕中央遮罩），Esc 或关闭按钮退出，内容、撤销历史与禁用/只读状态保持连续。',
  nav: THEME_NAV_NOTE,
  'group-nav': THEME_NAV_NOTE,
  'dual-nav': THEME_NAV_NOTE,
  'ai-chat':
    '`transport` 必填。函数型 transport 用 `createOpenAITransport`；生产环境不要把 API Key 下发到浏览器。无头场景用 `useChat`。',
  'ai-orb':
    '独立 canvas 活体球，可脱离 `UAiChat` 使用。`UAiChat` 欢迎区与工作中状态已内置，一般不必再嵌一套。',
  sheet:
    '宿主需给高度。填报用 `setCellReadonly` / `setRangeReadonly` 标记只读格，并隐藏工具栏与公式栏（`showToolbar` / `showFormulaBar` 设为 `false`）。模型与命令从 `@veltra/sheet-core` 导入，本包不 re-export。'
}

/** 尚无 skill api.md 可解析中文名时的兜底（ai / sheet 组件） */
export const CHINESE_BY_KEBAB: Record<string, string> = {
  'ai-chat': 'AI 对话',
  'ai-orb': '活体球',
  sheet: '电子表格'
}

export function parseApiTitleLine(line: string): { names: string; chinese: string } | null {
  const trimmed = line.replace(/^#{1,2}\s+/, '').trim()

  const hyphen = trimmed.match(/^(.+?)\s+-\s+(.+)$/)
  if (hyphen) {
    return { names: hyphen[1]!.trim(), chinese: hyphen[2]!.trim() }
  }

  const emDash = trimmed.match(/^(.+?)\s+—\s+(.+)$/)
  if (emDash) {
    return { names: emDash[1]!.trim(), chinese: emDash[2]!.trim() }
  }

  const colon = trimmed.match(/^(.+?)[：:]\s*(.+)$/)
  if (colon) {
    return { names: colon[1]!.trim(), chinese: colon[2]!.trim() }
  }

  return null
}

export type ComponentApiMdFrontmatter = { title: string; description?: string }

export type ComponentApiMdOptions = {
  hasTypes?: boolean
  note?: string
  /** 有则在正文前写入 YAML frontmatter（agent-docs） */
  frontmatter?: ComponentApiMdFrontmatter
  /** 类型文件路径；缺省 `./types.d.ts`（skill 伴生镜像） */
  typesHref?: string
  /** 内嵌类型源码（agent-docs 推送时仅有本目录，不可引用外部类型文件） */
  typesContent?: string
}

/** 将组件类型源文件整理为可内嵌文档的内容（与 skill types.d.ts 镜像规则一致） */
export function prepareTypeMirrorContent(content: string): string {
  return content
    .replace(
      /import type \{ NestedFieldMarker \} from '\.\.\/components\/form\/helper'\n\n/,
      `export interface NestedFieldMarker<T extends Record<string, any> = Record<string, any>> {
  __isNested: true
  fields: T
}

`
    )
    .trimEnd()
}

/** 顶层单行 `key: value`，值用 JSON 双引号，UTF-8 无 BOM */
export function renderYamlFrontmatter(fields: Record<string, string | undefined>): string {
  const lines = ['---']

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === '') continue
    lines.push(`${key}: ${JSON.stringify(value)}`)
  }

  lines.push('---', '')
  return `${lines.join('\n')}\n`
}

export function renderComponentApiMd(
  names: string,
  chinese: string,
  helpers: ComponentSkillHelper[],
  options: ComponentApiMdOptions = {}
): string {
  const { hasTypes = true, note, frontmatter, typesHref = './types.d.ts', typesContent } = options
  const heading = chinese ? `${names} - ${chinese}` : names
  const lines = [`# ${heading}`, '']

  if (typesContent) {
    lines.push('## 类型', '', '```ts', typesContent, '```', '')
  } else if (hasTypes) {
    lines.push('## 类型文件', '', `见 \`${typesHref}\``, '')
  } else {
    lines.push('无独立 Props / Emits；通过默认插槽使用。', '')
  }

  lines.push('## 示例', '', '见 `./examples.md`', '')

  if (note) {
    lines.push('## 备注', '', note, '')
  }

  if (helpers.length > 0) {
    lines.push('## 辅助工具', '', '本组件通常配合以下工具来使用。', '')

    for (const helper of helpers) {
      lines.push(
        `### ${helper.name}`,
        '',
        helper.purpose,
        '',
        '使用示例:',
        '',
        '```ts',
        helper.importLine,
        '```',
        ''
      )
    }
  }

  const body = `${lines.join('\n').trimEnd()}\n`

  if (!frontmatter) return body

  return `${renderYamlFrontmatter({
    title: frontmatter.title,
    description: frontmatter.description
  })}${body}`
}

/** 表单输入类控件集合：在 UForm 中必须使用 field，禁止 v-model */
export const FORM_INPUT_CONTROLS = new Set<string>([
  'auto-complete',
  'cascade',
  'checkbox',
  'checkbox-group',
  'code-editor',
  'condition-editor',
  'date-panel',
  'date-picker',
  'date-range-picker',
  'expression-editor',
  'file-picker',
  'grid-input',
  'group-input',
  'input',
  'multi-select',
  'multi-tree-select',
  'number-input',
  'number-range-input',
  'palette',
  'password-input',
  'radio',
  'radio-group',
  'rich-text-editor',
  'segment',
  'select',
  'slider',
  'switch',
  'textarea',
  'tree-select'
])

export function isFormInputControl(kebab: string): boolean {
  return FORM_INPUT_CONTROLS.has(kebab)
}

/** 表单输入类控件硬规则警告 */
export const UFORM_RULE_WARNING = '在 UForm 中必须使用 field，禁止 v-model。'

/** 面向文档内联的常用复合类型定义，消除不可解析的外部类型文件引用 */
export const COMMON_COMPOSITE_TYPES: Record<string, string> = {
  ComponentSize: `export type ComponentSize = 'small' | 'default' | 'large'`,

  ColorType: `export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'`,

  Placement: `export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'`,

  BreakpointName: `export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'`,

  PresetRule: `export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'`,

  ValidateRule: `export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设 */
  preset?: PresetRule
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}`,

  ComponentProps: `export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}`,

  FormComponentProps: `export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}`,

  PropsWithServerQuery: `export interface PropsWithServerQuery {
  /** 请求接口地址 */
  api?: string
  /** 请求查询参数 */
  query?: Record<string, any>
}`,

  DeconstructValue: `export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}`,

  DefineEvent: `export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}`,

  Index: `export type Index<Keys extends string, Val> = {
  [key in Keys]?: Val
}`,

  RenderReturn: `export type RenderReturn =
  | (undefined | VNode | string | null | number)[]
  | undefined
  | VNode
  | string
  | null
  | number`,

  NestedFieldMarker: `export interface NestedFieldMarker<T extends Record<string, any> = Record<string, any>> {
  __isNested: true
  fields: T
}`,

  Dater: `export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}`,

  Forest: `export type Forest<T = any> = T[]`,
  TreeNode: `export type TreeNode<T = any> = T`,
  ITreeNode: `export type ITreeNode<T = any> = T`
}

const COMPOSITE_TYPE_DEPENDENCIES: Record<string, string[]> = {
  FormComponentProps: [
    'ComponentProps',
    'ComponentSize',
    'BreakpointName',
    'ValidateRule',
    'PresetRule'
  ],
  ComponentProps: ['ComponentSize'],
  ValidateRule: ['PresetRule']
}

/** 从源码中按符号名提取 interface 或 type 声明语句 */
function extractDeclarationFromSource(source: string, name: string): string | undefined {
  // 匹配 interface
  const ifacePattern = new RegExp(
    `(?:^|\\n)(?:export\\s+)?interface\\s+${name}(?:<[^{]+>)?(?:\\s+extends[^{]+)?\\s*\\{`,
    'm'
  )
  const ifaceMatch = source.match(ifacePattern)
  if (ifaceMatch && ifaceMatch.index !== undefined) {
    const startIndex = ifaceMatch.index + (ifaceMatch[0].startsWith('\n') ? 1 : 0)
    const braceStart = source.indexOf('{', startIndex)
    if (braceStart !== -1) {
      let depth = 0
      for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') {
          depth--
          if (depth === 0) {
            return source.slice(startIndex, i + 1).trim()
          }
        }
      }
    }
  }

  // 匹配 type
  const typePattern = new RegExp(`(?:^|\\n)(?:export\\s+)?type\\s+${name}(?:<[^=]+>)?\\s*=`, 'm')
  const typeMatch = source.match(typePattern)
  if (typeMatch && typeMatch.index !== undefined) {
    const startIndex = typeMatch.index + (typeMatch[0].startsWith('\n') ? 1 : 0)
    let depth = 0
    for (let i = startIndex; i < source.length; i++) {
      if (source[i] === '{' || source[i] === '(' || source[i] === '<') depth++
      else if (source[i] === '}' || source[i] === ')' || source[i] === '>') depth--
      else if (source[i] === ';' && depth <= 0) {
        return source.slice(startIndex, i + 1).trim()
      } else if (source[i] === '\n' && depth <= 0) {
        const nextPart = source.slice(i + 1)
        if (/^(?:export|\/\*\*|\/\/|[a-zA-Z])/.test(nextPart)) {
          return source.slice(startIndex, i).trim()
        }
      }
    }
    return source.slice(startIndex).trim()
  }

  return undefined
}

export interface InlineCompositeTypesOptions {
  typeDir?: string
  resolveRelative?: (specifier: string) => string | undefined
}

/** 展开与内联常用复合类型，消除文档对外部不可解析类型文件的引用 */
export function inlineCompositeTypes(
  content: string,
  options: InlineCompositeTypesOptions = {}
): string {
  let result = content.replace(/\r\n/g, '\n')

  // 内联 NestedFieldMarker 辅助类型
  result = result.replace(
    /import\s+type\s*\{\s*NestedFieldMarker\s*\}\s*from\s*['"][^'"]+['"]\n*/g,
    ''
  )

  const neededTypes = new Set<string>()

  // 检查是否引用了 NestedFieldMarker
  if (/\bNestedFieldMarker\b/.test(result)) {
    neededTypes.add('NestedFieldMarker')
  }

  // 提取从 @veltra/utils 导入的类型符号
  const utilsImportRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@veltra\/utils['"](?:\n+)?/g
  for (const [, specifiersRaw] of result.matchAll(utilsImportRegex)) {
    if (!specifiersRaw) continue
    const specifiers = specifiersRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const spec of specifiers) {
      const clean = spec.replace(/^type\s+/, '').trim()
      if (clean) neededTypes.add(clean)
    }
  }
  result = result.replace(utilsImportRegex, '')

  // 提取从 @cat-kit/core 导入的类型符号
  const catKitImportRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@cat-kit\/core['"](?:\n+)?/g
  for (const [, specifiersRaw] of result.matchAll(catKitImportRegex)) {
    if (!specifiersRaw) continue
    const specifiers = specifiersRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const spec of specifiers) {
      const clean = spec.replace(/^type\s+/, '').trim()
      if (clean) neededTypes.add(clean)
    }
  }
  result = result.replace(catKitImportRegex, '')

  // 提取从 @floating-ui/dom 导入的 Placement
  const floatingImportRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@floating-ui\/dom['"](?:\n+)?/g
  for (const [, specifiersRaw] of result.matchAll(floatingImportRegex)) {
    if (!specifiersRaw) continue
    const specifiers = specifiersRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const spec of specifiers) {
      const clean = spec.replace(/^type\s+/, '').trim()
      if (clean) neededTypes.add(clean)
    }
  }
  result = result.replace(floatingImportRegex, '')

  // 解析并内联相对类型导入（如 import type { InputProps } from './input'）
  const relativeImportRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"](?:\n+)?/g
  const inlinedDeclarations: string[] = []

  for (const [, specifiersRaw, relSpecifier] of result.matchAll(relativeImportRegex)) {
    if (!specifiersRaw || !relSpecifier) continue
    const specifiers = specifiersRaw
      .split(',')
      .map((s) => s.trim().replace(/^type\s+/, ''))
      .filter(Boolean)

    let resolvedContent: string | undefined

    if (options.resolveRelative) {
      resolvedContent = options.resolveRelative(relSpecifier)
    } else if (options.typeDir) {
      const fullPath = join(
        options.typeDir,
        relSpecifier.endsWith('.ts') ? relSpecifier : `${relSpecifier}.ts`
      )
      if (existsSync(fullPath)) {
        try {
          resolvedContent = readFileSync(fullPath, 'utf8')
        } catch {
          // 读取失败跳过
        }
      }
    }

    if (resolvedContent) {
      for (const spec of specifiers) {
        const decl = extractDeclarationFromSource(resolvedContent, spec)
        if (decl) {
          inlinedDeclarations.push(decl)
        }
      }
    }
  }
  result = result.replace(relativeImportRegex, '')

  // 级联扩充依赖类型
  for (const [key, deps] of Object.entries(COMPOSITE_TYPE_DEPENDENCIES)) {
    if (neededTypes.has(key)) {
      for (const dep of deps) {
        neededTypes.add(dep)
      }
    }
  }

  // 收集并注入公共复合类型
  const compositeBlocks: string[] = []
  for (const [name, def] of Object.entries(COMMON_COMPOSITE_TYPES)) {
    if (neededTypes.has(name)) {
      compositeBlocks.push(def)
    }
  }

  const injectedParts = [...compositeBlocks, ...inlinedDeclarations]
  if (injectedParts.length === 0) {
    return result.trim()
  }

  // 寻找最后一个 import 语句的位置，插入到其下方；若无 import，则插在开头
  const importEndMatches = [...result.matchAll(/^import\s+[\s\S]*?;\s*$/gm)]
  if (importEndMatches.length > 0) {
    const lastMatch = importEndMatches.at(-1)!
    const insertIdx = lastMatch.index! + lastMatch[0].length
    const before = result.slice(0, insertIdx).trimEnd()
    const after = result.slice(insertIdx).trimStart()
    return `${before}\n\n${injectedParts.join('\n\n')}\n\n${after}`.trim()
  }

  return `${injectedParts.join('\n\n')}\n\n${result}`.trim()
}

export interface RenderComponentSingleDocOptions {
  pkg: string
  kebab: string
  names: string[]
  chinese?: string
  description?: string
  importSnippet?: string
  examples?: string
  typesContent?: string
  helpers?: ComponentSkillHelper[]
  note?: string
  notes?: string[]
  isFormInput?: boolean
}

/** 格式化示例区段：去除原有 frontmatter 与一级标题，二级标题降为三级 */
function formatExamplesSection(rawExamples: string | undefined, defaultComponent: string): string {
  if (!rawExamples || !rawExamples.trim()) {
    const tag = defaultComponent.startsWith('U')
      ? `u-${defaultComponent
          .slice(1)
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '')}`
      : defaultComponent
    return `### 基础用法\n\n\`\`\`vue\n<template>\n  <${tag} />\n</template>\n\`\`\``
  }

  let text = rawExamples.replace(/\r\n/g, '\n').trim()

  // 移除 frontmatter
  if (text.startsWith('---')) {
    const endMatch = text.slice(3).match(/\n---[ \t]*(?:\n|$)/)
    if (endMatch && endMatch.index !== undefined) {
      text = text.slice(3 + endMatch.index + endMatch[0].length).trim()
    }
  }

  // 移除开头的顶级 # 标题
  text = text.replace(/^#\s+[^\n]*\n*/, '').trim()

  // 将正文中的二级标题 ## 降为三级 ###（跳过代码块）
  const parts = text.split(/(```[\s\S]*?```)/g)
  const formatted = parts
    .map((part, index) => {
      if (index % 2 === 1) return part
      return part.replace(/^##\s+/gm, '### ')
    })
    .join('')

  return formatted.trim()
}

/**
 * 渲染面向 docs-mcp 的单文件组件文档
 * 统一标准：「Frontmatter（场景检索词 + 摘要）+ 引入概述 + 高频示例 + 展开后 API/类型 + 避坑与使用要点」
 */
export function renderComponentSingleDoc(options: RenderComponentSingleDocOptions): string {
  const {
    pkg,
    kebab,
    names,
    chinese = '',
    description,
    importSnippet,
    examples,
    typesContent,
    helpers = [],
    note,
    notes = [],
    isFormInput = isFormInputControl(kebab)
  } = options

  const joinedNames = names.join(' / ')
  const title = chinese ? `${joinedNames} - ${chinese}` : joinedNames

  const desc =
    description?.trim() ||
    `${joinedNames}${chinese ? ` (${chinese})` : ''} 组件，属于 @veltra/${pkg}。${
      isFormInput
        ? '表单输入控件，支持在 UForm 内由 field 自动接管状态绑定与校验。'
        : '提供丰富的交互属性与自定义插槽，适用于各类业务场景。'
    }`

  const lines: string[] = []

  // Frontmatter
  lines.push(renderYamlFrontmatter({ title, description: desc }).trimEnd())

  // 一级标题
  lines.push('', `# ${title}`, '')

  // 1. 引入概述
  lines.push('## 引入', '')
  if (importSnippet?.trim()) {
    lines.push('```ts', importSnippet.trim(), '```', '')
  } else {
    lines.push('```ts', `import { ${names.join(', ')} } from '@veltra/${pkg}'`, '```', '')
  }

  // 2. 高频示例
  lines.push('## 示例', '')
  const cleanExamples = formatExamplesSection(examples, names[0] ?? kebab)
  lines.push(cleanExamples, '')

  // 3. 展开后 API / 类型
  lines.push('## API / 类型', '')
  if (typesContent?.trim()) {
    lines.push('```ts', typesContent.trim(), '```', '')
  } else {
    lines.push('无独立 Props / Emits；通过默认插槽使用。', '')
  }

  if (helpers.length > 0) {
    lines.push('### 辅助工具', '', '本组件通常配合以下工具来使用。', '')
    for (const helper of helpers) {
      lines.push(
        `#### ${helper.name}`,
        '',
        helper.purpose,
        '',
        '使用示例:',
        '',
        '```ts',
        helper.importLine,
        '```',
        ''
      )
    }
  }

  // 4. 避坑与使用要点
  lines.push('## 避坑与使用要点', '')
  const noteList: string[] = []
  if (isFormInput) {
    noteList.push(UFORM_RULE_WARNING)
  }
  if (note?.trim()) {
    noteList.push(note.trim())
  }
  for (const n of notes) {
    const trimmed = n.trim()
    if (trimmed && !noteList.includes(trimmed)) {
      noteList.push(trimmed)
    }
  }
  if (noteList.length === 0) {
    noteList.push('遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。')
  }

  for (const n of noteList) {
    lines.push(`- ${n}`)
  }
  lines.push('')

  return `${lines.join('\n').trimEnd()}\n`
}
