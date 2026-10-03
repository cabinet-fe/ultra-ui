import type { DatabaseSync } from 'node:sqlite'

import { Hono } from 'hono'

import { getDb } from './db'
import { ERROR_CODES, type ConnectorError } from './errors'

/**
 * 智慧表格演示的整表文档存取（SQLite，dev-only）：
 * 每张演示表一行记录，doc_json 存全量文档（fields + rows），
 * PUT 即全量覆盖（upsert），页面刷新后数据保留。
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

/** 固定演示表 key（示例只维护这一张表） */
export const DEMO_DOC_KEY = 'default'

/** 演示上限：防误传巨型文档拖垮 dev 服务 */
const MAX_FIELDS = 64
const MAX_ROWS = 5_000
const MAX_OPTIONS = 64
const MAX_ID_LENGTH = 64
const MAX_NAME_LENGTH = 64

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): ConnectorError {
  return { code: ERROR_CODES.INVALID_REQUEST, message }
}

/** 内置示例数据：9 种字段类型全覆盖，6 行记录（含空单元格） */
const SEED_DOC: TableDoc = {
  fields: [
    { id: 'name', name: '需求名称', type: 'text' },
    { id: 'owner', name: '负责人', type: 'text' },
    { id: 'effort', name: '工作量（人日）', type: 'number' },
    { id: 'status', name: '状态', type: 'select', options: ['设计中', '开发中', '已上线'] },
    { id: 'tags', name: '标签', type: 'multi-select', options: ['体验', '性能', '稳定性', '文档'] },
    { id: 'due', name: '截止日期', type: 'date' },
    { id: 'done', name: '已验收', type: 'checkbox' },
    { id: 'progress', name: '进度', type: 'progress' },
    { id: 'team', name: '协作成员', type: 'member' },
    { id: 'attachments', name: '设计稿', type: 'image' }
  ],
  rows: [
    {
      id: 'r1',
      values: {
        name: '智慧表格示例页搭建',
        owner: '王小虎',
        effort: 8,
        status: '设计中',
        tags: ['体验', '文档'],
        due: '2026-10-15',
        done: false,
        progress: 35,
        team: ['王小虎', '李静'],
        attachments: ['https://picsum.photos/seed/smart-table-r1a/120/90']
      }
    },
    {
      id: 'r2',
      values: {
        name: '看板视图分组渲染',
        owner: '李静',
        effort: 5,
        status: '开发中',
        tags: ['体验'],
        due: '2026-10-20',
        done: false,
        progress: 60,
        team: ['李静'],
        attachments: [
          'https://picsum.photos/seed/smart-table-r2a/120/90',
          'https://picsum.photos/seed/smart-table-r2b/120/90'
        ]
      }
    },
    {
      id: 'r3',
      values: {
        name: 'AI 生成字段值流式接入',
        owner: '陈远',
        effort: 12,
        status: '开发中',
        tags: ['体验', '性能'],
        due: '2026-10-25',
        done: false,
        progress: 45,
        team: ['陈远', '周舟']
      }
    },
    {
      id: 'r4',
      values: {
        name: '演示数据 SQLite 持久化',
        owner: '赵敏',
        effort: 3,
        status: '已上线',
        tags: ['稳定性'],
        due: '2026-09-30',
        done: true,
        progress: 100,
        team: [],
        attachments: []
      }
    },
    {
      id: 'r5',
      values: {
        name: '多维表格组件用法文档',
        owner: '周舟',
        status: '设计中',
        tags: ['文档'],
        done: false,
        progress: 10,
        team: ['周舟']
      }
    },
    {
      id: 'r6',
      values: {
        name: '行内编辑交互走查',
        owner: '王小虎',
        tags: ['体验'],
        due: '2026-11-05',
        done: false,
        progress: 0
      }
    }
  ]
}

function ensureSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS smart_table_docs (
      doc_key TEXT PRIMARY KEY,
      doc_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

/** 读取演示表文档；库空或坏数据时写入并返回内置示例数据 */
export function getSmartTableDoc(key: string = DEMO_DOC_KEY): TableDoc {
  const database = getDb()
  ensureSchema(database)
  const row = database
    .prepare('SELECT doc_json FROM smart_table_docs WHERE doc_key = ?')
    .get(key) as Record<string, unknown> | undefined
  if (row) {
    try {
      return JSON.parse(String(row.doc_json)) as TableDoc
    } catch {
      // 坏数据行不阻断演示：落回示例数据并覆盖
    }
  }
  saveSmartTableDoc(key, SEED_DOC)
  return SEED_DOC
}

/** 全量 upsert 演示表文档 */
export function saveSmartTableDoc(key: string, doc: TableDoc): void {
  const database = getDb()
  ensureSchema(database)
  database
    .prepare(
      `INSERT INTO smart_table_docs (doc_key, doc_json, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT (doc_key) DO UPDATE SET doc_json = excluded.doc_json, updated_at = excluded.updated_at`
    )
    .run(key, JSON.stringify(doc))
}

function isValidId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const id = value.trim()
  if (id === '' || id.length > MAX_ID_LENGTH) return null
  return id
}

function isFieldType(value: unknown): value is FieldType {
  return typeof value === 'string' && FIELD_TYPES.includes(value as FieldType)
}

function validateField(
  input: unknown
): { ok: true; value: TableField } | { ok: false; message: string } {
  if (!isRecord(input)) return { ok: false, message: 'field 必须是 JSON 对象' }
  const id = isValidId(input.id)
  if (!id) return { ok: false, message: `field.id 必须是 1~${MAX_ID_LENGTH} 字符` }
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name === '' || name.length > MAX_NAME_LENGTH) {
    return { ok: false, message: `field.name 必须是 1~${MAX_NAME_LENGTH} 字符` }
  }
  if (!isFieldType(input.type)) {
    return { ok: false, message: `field.type 必须是 ${FIELD_TYPES.join(' / ')} 之一` }
  }
  const { type } = input
  const field: TableField = { id, name, type }
  if (type === 'select' || type === 'multi-select') {
    const options = input.options
    if (
      !Array.isArray(options) ||
      options.length === 0 ||
      options.length > MAX_OPTIONS ||
      !options.every((option) => typeof option === 'string' && option.trim() !== '') ||
      new Set(options).size !== options.length
    ) {
      return {
        ok: false,
        message: `${type} 字段的 options 必须是 1~${MAX_OPTIONS} 个非空且不重复的字符串`
      }
    }
    field.options = options
  }
  return { ok: true, value: field }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(Date.parse(value))
}

/** 按字段类型校验单元格值（null = 空） */
function validateCellValue(value: unknown, field: TableField): string | null {
  if (value === null) return null
  switch (field.type) {
    case 'text':
      return typeof value === 'string' ? null : 'text 字段的值必须是字符串'
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? null
        : 'number 字段的值必须是有限数字'
    case 'select': {
      if (value === '') return null // 清空选择
      return typeof value === 'string' && field.options?.includes(value)
        ? null
        : `select 字段的值必须是选项之一：${field.name}`
    }
    case 'multi-select':
      return Array.isArray(value) &&
        value.every((item) => typeof item === 'string' && field.options?.includes(item))
        ? null
        : `multi-select 字段的值必须是选项数组的子集：${field.name}`
    case 'date':
      return typeof value === 'string' && (value === '' || isIsoDate(value))
        ? null
        : 'date 字段的值必须是 YYYY-MM-DD（或空字符串）'
    case 'checkbox':
      return typeof value === 'boolean' ? null : 'checkbox 字段的值必须是布尔值'
    case 'progress':
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
        ? null
        : 'progress 字段的值必须是 0~100 的数字'
    case 'member':
    case 'image':
      return Array.isArray(value) &&
        value.every((item) => typeof item === 'string' && item.trim() !== '')
        ? null
        : `${field.type} 字段的值必须是非空字符串数组`
  }
}

/** 校验整表文档形状；非法返回第一条错误信息 */
export function validateTableDoc(
  input: unknown
): { ok: true; value: TableDoc } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('请求体必须是 JSON 对象') }
  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    return { ok: false, error: invalid('fields 必须是非空数组') }
  }
  if (input.fields.length > MAX_FIELDS) {
    return { ok: false, error: invalid(`fields 最多 ${MAX_FIELDS} 个`) }
  }
  if (!Array.isArray(input.rows)) return { ok: false, error: invalid('rows 必须是数组') }
  if (input.rows.length > MAX_ROWS) {
    return { ok: false, error: invalid(`rows 最多 ${MAX_ROWS} 行`) }
  }

  const fields: TableField[] = []
  const fieldIds = new Set<string>()
  for (const raw of input.fields) {
    const field = validateField(raw)
    if (!field.ok) return { ok: false, error: invalid(field.message) }
    if (fieldIds.has(field.value.id)) {
      return { ok: false, error: invalid(`field.id 重复：${field.value.id}`) }
    }
    fieldIds.add(field.value.id)
    fields.push(field.value)
  }

  const rows: TableRow[] = []
  const rowIds = new Set<string>()
  for (const raw of input.rows) {
    if (!isRecord(raw)) return { ok: false, error: invalid('row 必须是 JSON 对象') }
    const id = isValidId(raw.id)
    if (!id) return { ok: false, error: invalid(`row.id 必须是 1~${MAX_ID_LENGTH} 字符`) }
    if (rowIds.has(id)) return { ok: false, error: invalid(`row.id 重复：${id}`) }
    if (!isRecord(raw.values)) return { ok: false, error: invalid('row.values 必须是 JSON 对象') }
    const values: Record<string, CellValue> = {}
    for (const [fieldId, value] of Object.entries(raw.values)) {
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return { ok: false, error: invalid(`row.values 引用了不存在的字段：${fieldId}`) }
      const problem = validateCellValue(value, field)
      if (problem) return { ok: false, error: invalid(`${problem}（行 ${id}）`) }
      values[fieldId] = value as CellValue
    }
    rowIds.add(id)
    rows.push({ id, values })
  }

  return { ok: true, value: { fields, rows } }
}

/** 智慧表格持久化 Hono 子应用：由 server/dev.ts 挂到 /smart-table */
export const smartTableApp = new Hono()

/** GET /smart-table/table — 读取演示表文档（首次访问自动写入示例数据） */
smartTableApp.get('/table', (c) => {
  return c.json({ ok: true, doc: getSmartTableDoc() })
})

/** PUT /smart-table/table — 校验 fields/rows 形状后全量 upsert */
smartTableApp.put('/table', async (c) => {
  let parsed: unknown
  try {
    parsed = await c.req.json()
  } catch {
    return c.json({ ok: false, error: invalid('请求体必须是 JSON') }, 400)
  }
  const result = validateTableDoc(parsed)
  if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
  saveSmartTableDoc(DEMO_DOC_KEY, result.value)
  return c.json({ ok: true, doc: result.value })
})
