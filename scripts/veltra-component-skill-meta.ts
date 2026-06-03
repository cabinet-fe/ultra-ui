/** 组件技能文档：伴生工具（仅列需手动 import 的 API） */
export type ComponentSkillHelper = { name: string; purpose: string; importLine: string }

export const INTRO_BY_KEBAB: Record<string, string> = {
  action: '用于在列表、表格或详情区展示单个或成组操作按钮。',
  'auto-complete': '用于输入时按关键字提供候选项并回填选中值。',
  badge: '用于在元素旁显示数量、状态点或简短标记。',
  'batch-edit': '用于左侧选择记录、右侧表单批量编辑字段的场景。',
  breadcrumb: '用于展示页面层级路径并支持逐级返回。',
  button: '用于触发普通、主要、危险等用户操作，可组合成按钮组。',
  calendar: '用于按月展示日期网格并承载日期相关内容。',
  card: '用于将标题、封面、内容和操作收束为独立信息块。',
  cascade: '用于从多级联动选项中选择一个路径值。',
  'check-tag': '用于以标签形态切换单个可选状态。',
  checkbox: '用于表示单个布尔选择，也可作为复选组里的选项。',
  'checkbox-group': '用于在一组复选项中选择多个值。',
  'code-editor': '用于编辑代码或结构化文本内容。',
  collapse: '用于将多段内容折叠展开，减少页面纵向占用。',
  'condition-editor': '用于可视化编辑条件分组和条件表达式。',
  'context-menu': '用于在右键或指定位置弹出操作菜单。',
  'date-panel': '用于直接嵌入日期选择面板，不提供输入框外壳。',
  'date-picker': '用于通过输入框和弹层选择单个日期。',
  'date-range-picker': '用于通过输入框和弹层选择开始、结束日期。',
  dialog: '用于需要用户聚焦处理的模态对话框。',
  drawer: '用于从屏幕边缘滑出补充内容或操作表单。',
  dropdown: '用于在触发元素旁展开简短菜单或浮层内容。',
  empty: '用于展示列表、表格或区域没有数据时的占位状态。',
  'expression-editor': '用于编辑变量、运算符和值组成的表达式。',
  'file-picker': '用于选择或上传本地文件并展示文件列表。',
  'file-viewer': '用于预览图片、PDF、视频等文件内容。',
  'float-button': '用于在页面固定位置提供高频快捷操作。',
  form: '用于承载 FormModel/DynamicFormModel 并自动绑定带 field 的表单控件。',
  'form-item': '用于在表单中单独控制字段标签、校验和反馈。',
  'gantt-chart': '用于以时间轴形式展示任务跨度和进度。',
  grid: '用于按列数和间距组织响应式栅格布局。',
  'grid-input': '用于输入固定长度的分格验证码或短码。',
  'group-input': '用于把多段输入组合成一个逻辑字段。',
  icon: '用于统一渲染 @veltra/icons 或自定义图标组件。',
  input: '用于输入单行文本或可清空的字符串值。',
  layout: '用于通过 CSS grid 的 rows、cols 和 gap 创建可调整区域布局。',
  list: '用于按统一尺寸渲染一组数据列表项。',
  loading: '用于组件或区域处于异步处理中时显示加载状态或遮罩。',
  menu: '用于展示导航菜单、子菜单和菜单项。',
  message: '用于命令式显示全局短消息反馈。',
  'message-confirm': '用于命令式弹出需要用户确认的消息框。',
  'multi-select': '用于从下拉选项中选择多个值。',
  'multi-tree-select': '用于从树形数据中选择多个节点值。',
  'node-render': '用于把 render 函数或 VNode 渲染进模板占位。',
  notification: '用于命令式显示全局通知条。',
  number: '用于格式化展示数字、金额或精度控制后的数值。',
  'number-input': '用于输入可增减、可限制范围的数字值。',
  'number-range-input': '用于输入一组数字区间的最小值和最大值。',
  paginator: '用于分页切换页码、页容量和总量展示。',
  palette: '用于选择或展示一组颜色值。',
  'password-input': '用于输入密码、验证码等可隐藏内容。',
  'pop-confirm': '用于在触发元素旁展示轻量确认弹层。',
  progress: '用于展示任务完成比例或加载进度。',
  'progress-nodes': '用于按节点展示流程进度或状态。',
  radio: '用于表示单个互斥选项，通常配合单选组使用。',
  'radio-group': '用于在一组选项中选择单个值。',
  'rich-text-editor': '用于编辑富文本内容并输出结构化文本。',
  scroll: '用于提供自定义滚动容器和滚动行为控制。',
  select: '用于从下拉选项中选择单个值。',
  slider: '用于通过滑动条选择连续或离散数值。',
  steps: '用于展示分步骤流程及当前步骤状态。',
  switch: '用于切换开启/关闭类布尔状态。',
  table: '用于展示结构化数据、列配置和表格交互。',
  'table-editor': '用于在表格中直接编辑行列数据。',
  tabs: '用于在同一区域切换多个并列内容面板。',
  tag: '用于展示分类、状态或可关闭的短标签。',
  text: '用于展示带省略、复制或状态样式的文本。',
  textarea: '用于输入多行文本内容。',
  theme: '用于预览和编辑组件库主题配置。',
  tip: '用于在触发元素旁显示提示、说明或气泡内容。',
  tree: '用于展示层级数据并支持展开、选择等树操作。',
  'tree-select': '用于从树形数据中选择单个节点值。',
  watermark: '用于给页面或区域叠加文本或图片水印。'
}

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
  'context-menu': [
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
  intro: string,
  helpers: ComponentSkillHelper[]
): string {
  const lines = [
    `# ${names} - ${chinese}`,
    '',
    '## 简介',
    '',
    intro,
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
