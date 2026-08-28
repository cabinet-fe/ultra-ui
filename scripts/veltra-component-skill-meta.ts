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
  ]
}

/** nav 系列组件共享的外观备注 */
const THEME_NAV_NOTE =
  "外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见 `../../../styles/theme.md`「侧栏导航外观」。"

/** 组件技能文档：附加备注（渲染为 api.md 的「备注」一节，内容手工维护） */
export const NOTES_BY_KEBAB: Record<string, string> = {
  nav: THEME_NAV_NOTE,
  'group-nav': THEME_NAV_NOTE,
  'dual-nav': THEME_NAV_NOTE
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

export function renderComponentApiMd(
  names: string,
  chinese: string,
  helpers: ComponentSkillHelper[],
  options: { hasTypes?: boolean; note?: string } = {}
): string {
  const { hasTypes = true, note } = options
  const lines = [`# ${names} - ${chinese}`, '']

  if (hasTypes) {
    lines.push('## 类型文件', '', '见 `./types.d.ts`', '')
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

  return `${lines.join('\n').trimEnd()}\n`
}
