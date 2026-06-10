/** 组件技能文档：伴生工具（仅列需手动 import 的 API） */
export type ComponentSkillHelper = { name: string; purpose: string; importLine: string }

export const HELPERS_BY_KEBAB: Record<string, ComponentSkillHelper[]> = {
  'batch-edit': [
    {
      name: 'FormModel',
      purpose: '批量编辑右侧表单的数据与校验模型。',
      importLine: "import { FormModel } from '@veltra/desktop'"
    },
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
  form: [
    {
      name: 'FormModel',
      purpose:
        '静态字段表单：构造时定义全部字段；`model.data` 与带 `field` 的子组件自动双向绑定（勿手写 v-model / u-form-item）。',
      importLine: "import { FormModel, formField, nestField } from '@veltra/desktop'"
    },
    {
      name: 'DynamicFormModel',
      purpose: '运行时 `add` / `delete` 增删字段；`data` 可替换为外部 reactive 对象。',
      importLine: "import { DynamicFormModel } from '@veltra/desktop'"
    },
    {
      name: 'formField',
      purpose: '字段无 `value` 初始值或需显式泛型时包装表单项定义。',
      importLine: "import { formField } from '@veltra/desktop'"
    },
    {
      name: 'nestField',
      purpose: '嵌套对象字段（如 `profile.name`）必须用其包裹子字段。',
      importLine: "import { nestField } from '@veltra/desktop'"
    }
  ],
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
      name: 'MessageConfirm',
      purpose: '函数式确认框；另有 `primary` / `success` / `warning` / `danger` 等快捷方法。',
      importLine: "import { MessageConfirm } from '@veltra/desktop'"
    }
  ],
  notification: [
    {
      name: 'Notification',
      purpose: '函数式通知条，命令式弹出。',
      importLine: "import { Notification } from '@veltra/desktop'"
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
  helpers: ComponentSkillHelper[]
): string {
  const lines = [
    `# ${names} - ${chinese}`,
    '',
    '## 类型文件',
    '',
    '见 `./types.d.ts`',
    '',
    '## 示例',
    '',
    '见 `./examples.md`',
    ''
  ]

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
