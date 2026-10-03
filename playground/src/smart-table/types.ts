/**
 * 智慧表格演示页的文档类型，与参考服务契约（`server/smart-table.ts` 的
 * FIELD_TYPES / TableField / TableRow / TableDoc）保持对齐。
 * 服务端模块依赖 node:sqlite / hono，浏览器侧不可直接引用，故在此镜像声明。
 */

/** 字段类型全集：文本、数字、单选、多选、日期、复选框、进度、成员、图片 */
export const FIELD_TYPES = [
  'text',
  'number',
  'select',
  'multi-select',
  'date',
  'checkbox',
  'progress',
  'member',
  'image'
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export interface TableField {
  id: string
  name: string
  type: FieldType
  /** 单选/多选的候选选项（选项值即标签）；其余类型无 */
  options?: string[]
}

/** 单元格值：缺键或 null 表示空单元格 */
export type CellValue = string | number | boolean | string[] | null

export interface TableRow {
  id: string
  values: Record<string, CellValue>
}

export interface TableDoc {
  fields: TableField[]
  rows: TableRow[]
}

/** 字段类型的界面文案（表头类型标识与新增字段对话框共用） */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '文本',
  number: '数字',
  select: '单选',
  'multi-select': '多选',
  date: '日期',
  checkbox: '复选框',
  progress: '进度',
  member: '成员',
  image: '图片'
}

/** 选项类字段（单选/多选）：新增时需要配置候选选项 */
export function isOptionsField(type: FieldType): boolean {
  return type === 'select' || type === 'multi-select'
}
