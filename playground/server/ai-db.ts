import { Hono } from 'hono'
import type { Context } from 'hono'

import { ERROR_CODES, type ConnectorError } from './errors'

/**
 * AI 数据库建模演示的内存数据库（dev-only，进程重启即空）：
 * 表（列定义）/ 关系（1-1、1-n、n-n）/ 行数据全存进程内存。
 * 纯函数操作集 + Hono 子应用，由 server/dev.ts 挂到 /ai-db。
 */

/** 列类型全集：字符串、数字、布尔、日期（YYYY-MM-DD） */
export const COLUMN_TYPES = ['string', 'number', 'boolean', 'date'] as const
export type ColumnType = (typeof COLUMN_TYPES)[number]

export interface ColumnDef {
  name: string
  type: ColumnType
  /** 主键列（一表至多一个，隐含非空 + 行值唯一） */
  primaryKey?: boolean
  /** 可空（默认不可空） */
  nullable?: boolean
  /** 备注 */
  comment?: string
}

export interface TableDef {
  name: string
  /** 所属中文业务模块名（如「商品」「采购」「会员」），缺省即未分组 */
  module?: string
  columns: ColumnDef[]
}

/** 关系类型全集：一对一、一对多、多对多 */
export const RELATIONSHIP_TYPES = ['1-1', '1-n', 'n-n'] as const
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]

/** 关系端点：表名 + 列名（两端必须已存在于对应表） */
export interface RelationshipEndpoint {
  table: string
  column: string
}

export interface RelationshipDef {
  type: RelationshipType
  from: RelationshipEndpoint
  to: RelationshipEndpoint
}

/** 行数据：列名 → 标量值（null = 空） */
export type RowValue = string | number | boolean | null
export type RowData = Record<string, RowValue>

/** 演示上限：防误传巨型负载拖垮 dev 服务 */
const MAX_TABLES = 64
const MAX_COLUMNS = 64
const MAX_RELATIONSHIPS = 256
const MAX_BATCH_ROWS = 1_000
const MAX_TOTAL_ROWS = 10_000
const MAX_NAME_LENGTH = 64
const MAX_COMMENT_LENGTH = 200
const MAX_AGGREGATIONS = 16

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): ConnectorError {
  return { code: ERROR_CODES.INVALID_REQUEST, message }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(Date.parse(value))
}

/** 名称类字段校验：trim 后 1~64 字符 */
function isName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name === '' || name.length > MAX_NAME_LENGTH ? null : name
}

/** 按列类型校验标量形状；返回 null 表示通过 */
function checkScalarByType(value: unknown, type: ColumnType, label: string): string | null {
  switch (type) {
    case 'string':
      return typeof value === 'string' ? null : `${label}必须是字符串`
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : `${label}必须是有限数字`
    case 'boolean':
      return typeof value === 'boolean' ? null : `${label}必须是布尔值`
    case 'date':
      return typeof value === 'string' && isIsoDate(value) ? null : `${label}必须是 YYYY-MM-DD`
  }
}

/** 行值校验（null = 空单元格，受列可空性约束） */
function checkRowValue(value: unknown, column: ColumnDef): string | null {
  if (value === null) {
    if (column.primaryKey) return `主键列不可为空：${column.name}`
    if (!column.nullable) return `不可空列不可为空：${column.name}`
    return null
  }
  return checkScalarByType(value, column.type, `${column.type} 列「${column.name}」的值`)
}

/** 过滤值校验：只看标量形状，null 表示匹配空值（不受列可空性约束） */
function checkFilterValue(value: unknown, column: ColumnDef): string | null {
  if (value === null) return null
  return checkScalarByType(value, column.type, `过滤条件「${column.name}」的值`)
}

/** 内存库状态：表定义 / 行数据 / 关系（纯函数操作集的唯一可变载体） */
export interface AiDb {
  /** 表定义，键为表名 */
  tables: Map<string, TableDef>
  /** 行数据，键为表名 */
  rows: Map<string, RowData[]>
  relationships: RelationshipDef[]
}

/** 新建空内存库；aiDbApp 用进程内单例，测试各自创建隔离实例 */
export function createAiDb(): AiDb {
  return { tables: new Map(), rows: new Map(), relationships: [] }
}

function findColumn(table: TableDef, name: string): ColumnDef | undefined {
  return table.columns.find((column) => column.name === name)
}

/** 校验表定义形状（表名 + 可选中文模块名 + 列名唯一 + 类型枚举 + 至多一个主键） */
export function validateTableDef(
  input: unknown
): { ok: true; value: TableDef } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('请求体必须是 JSON 对象') }
  const name = isName(input.name)
  if (!name) return { ok: false, error: invalid(`表名必须是 1~${MAX_NAME_LENGTH} 字符`) }
  let moduleName: string | undefined
  if (input.module !== undefined) {
    const module = isName(input.module)
    if (!module) {
      return { ok: false, error: invalid(`module 必须是 1~${MAX_NAME_LENGTH} 字符`) }
    }
    moduleName = module
  }
  if (!Array.isArray(input.columns) || input.columns.length === 0) {
    return { ok: false, error: invalid('columns 必须是非空数组') }
  }
  if (input.columns.length > MAX_COLUMNS) {
    return { ok: false, error: invalid(`columns 最多 ${MAX_COLUMNS} 个`) }
  }

  const columns: ColumnDef[] = []
  const names = new Set<string>()
  let primaryKeySeen = false
  for (const raw of input.columns) {
    if (!isRecord(raw)) return { ok: false, error: invalid('column 必须是 JSON 对象') }
    const columnName = isName(raw.name)
    if (!columnName) {
      return { ok: false, error: invalid(`column.name 必须是 1~${MAX_NAME_LENGTH} 字符`) }
    }
    if (names.has(columnName)) {
      return { ok: false, error: invalid(`column.name 重复：${columnName}`) }
    }
    if (typeof raw.type !== 'string' || !COLUMN_TYPES.includes(raw.type as ColumnType)) {
      return { ok: false, error: invalid(`column.type 必须是 ${COLUMN_TYPES.join(' / ')} 之一`) }
    }
    const column: ColumnDef = { name: columnName, type: raw.type as ColumnType }
    if (raw.primaryKey !== undefined) {
      if (typeof raw.primaryKey !== 'boolean') {
        return { ok: false, error: invalid(`column.primaryKey 必须是布尔值：${columnName}`) }
      }
      if (raw.primaryKey) {
        if (primaryKeySeen) {
          return { ok: false, error: invalid('一张表至多一个主键列') }
        }
        primaryKeySeen = true
        column.primaryKey = true
      }
    }
    if (raw.nullable !== undefined) {
      if (typeof raw.nullable !== 'boolean') {
        return { ok: false, error: invalid(`column.nullable 必须是布尔值：${columnName}`) }
      }
      if (raw.nullable && column.primaryKey) {
        return { ok: false, error: invalid(`主键列不可同时可空：${columnName}`) }
      }
      if (raw.nullable) column.nullable = true
    }
    if (raw.comment !== undefined) {
      if (typeof raw.comment !== 'string' || raw.comment.length > MAX_COMMENT_LENGTH) {
        return {
          ok: false,
          error: invalid(`column.comment 必须是不超过 ${MAX_COMMENT_LENGTH} 字符的字符串`)
        }
      }
      if (raw.comment !== '') column.comment = raw.comment
    }
    names.add(columnName)
    columns.push(column)
  }
  const table: TableDef = { name, columns }
  if (moduleName !== undefined) table.module = moduleName
  return { ok: true, value: table }
}

/** 校验批量行数据：未知列 / 类型不符 / 不可空列缺值 / 主键值重复均 400 */
export function validateRowsInput(
  table: TableDef,
  existingRows: RowData[],
  input: unknown
): { ok: true; value: RowData[] } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('请求体必须是 JSON 对象') }
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: invalid('rows 必须是非空数组') }
  }
  if (input.rows.length > MAX_BATCH_ROWS) {
    return { ok: false, error: invalid(`rows 单批最多 ${MAX_BATCH_ROWS} 行`) }
  }
  if (existingRows.length + input.rows.length > MAX_TOTAL_ROWS) {
    return { ok: false, error: invalid(`单表累计最多 ${MAX_TOTAL_ROWS} 行`) }
  }

  const primaryKey = table.columns.find((column) => column.primaryKey)
  const primaryKeyValues = new Set<RowValue>()
  if (primaryKey) {
    for (const row of existingRows) primaryKeyValues.add(row[primaryKey.name] ?? null)
  }

  const rows: RowData[] = []
  for (const raw of input.rows) {
    if (!isRecord(raw)) return { ok: false, error: invalid('row 必须是 JSON 对象') }
    // 不可空列（含主键）缺键即视为缺值
    for (const column of table.columns) {
      if (!(column.name in raw) && (column.primaryKey || !column.nullable)) {
        return { ok: false, error: invalid(`row 缺少不可空列的值：${column.name}`) }
      }
    }
    const row: RowData = {}
    for (const [key, value] of Object.entries(raw)) {
      const column = findColumn(table, key)
      if (!column) {
        return { ok: false, error: invalid(`row 引用了不存在的列：${key}（表 ${table.name}）`) }
      }
      const problem = checkRowValue(value, column)
      if (problem) return { ok: false, error: invalid(problem) }
      row[key] = value as RowValue
    }
    if (primaryKey) {
      const pkValue = row[primaryKey.name] as RowValue
      if (primaryKeyValues.has(pkValue)) {
        return {
          ok: false,
          error: invalid(`主键值重复：${String(pkValue)}（列 ${primaryKey.name}）`)
        }
      }
      primaryKeyValues.add(pkValue)
    }
    rows.push(row)
  }
  return { ok: true, value: rows }
}

/** 校验过滤条件：键必须是存在列，值按列类型校验标量形状 */
export function validateFilterInput(
  table: TableDef,
  input: unknown
): { ok: true; value: Record<string, RowValue> } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('filter 必须是 JSON 对象') }
  const filter: Record<string, RowValue> = {}
  for (const [key, value] of Object.entries(input)) {
    const column = findColumn(table, key)
    if (!column) {
      return { ok: false, error: invalid(`filter 引用了不存在的列：${key}（表 ${table.name}）`) }
    }
    const problem = checkFilterValue(value, column)
    if (problem) return { ok: false, error: invalid(problem) }
    filter[key] = value as RowValue
  }
  return { ok: true, value: filter }
}

/** 行是否命中受控等值过滤（null 过滤值匹配空值：null 或缺键） */
export function matchesFilter(row: RowData, filter: Record<string, RowValue>): boolean {
  return Object.entries(filter).every(([key, expected]) => (row[key] ?? null) === expected)
}

function validateEndpoint(
  db: AiDb,
  input: unknown,
  label: string
): { ok: true; value: RelationshipEndpoint } | { ok: false; message: string } {
  if (!isRecord(input)) return { ok: false, message: `${label} 必须是 JSON 对象` }
  const table = isName(input.table)
  if (!table) return { ok: false, message: `${label}.table 必须是 1~${MAX_NAME_LENGTH} 字符` }
  const column = isName(input.column)
  if (!column) return { ok: false, message: `${label}.column 必须是 1~${MAX_NAME_LENGTH} 字符` }
  const tableDef = db.tables.get(table)
  if (!tableDef) return { ok: false, message: `${label} 引用了不存在的表：${table}` }
  if (!findColumn(tableDef, column)) {
    return { ok: false, message: `${label} 引用了表 ${table} 上不存在的列：${column}` }
  }
  return { ok: true, value: { table, column } }
}

/** 校验关系集合：类型枚举 + 两端表/列必须已存在 + 不重复 */
export function validateRelationships(
  db: AiDb,
  input: unknown
): { ok: true; value: RelationshipDef[] } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('请求体必须是 JSON 对象') }
  if (!Array.isArray(input.relationships)) {
    return { ok: false, error: invalid('relationships 必须是数组') }
  }
  if (input.relationships.length > MAX_RELATIONSHIPS) {
    return { ok: false, error: invalid(`relationships 最多 ${MAX_RELATIONSHIPS} 条`) }
  }

  const relationships: RelationshipDef[] = []
  const keys = new Set<string>()
  for (const raw of input.relationships) {
    if (!isRecord(raw)) return { ok: false, error: invalid('relationship 必须是 JSON 对象') }
    if (
      typeof raw.type !== 'string' ||
      !RELATIONSHIP_TYPES.includes(raw.type as RelationshipType)
    ) {
      return {
        ok: false,
        error: invalid(`relationship.type 必须是 ${RELATIONSHIP_TYPES.join(' / ')} 之一`)
      }
    }
    const relType = raw.type as RelationshipType
    const from = validateEndpoint(db, raw.from, 'relationship.from')
    if (!from.ok) return { ok: false, error: invalid(from.message) }
    const to = validateEndpoint(db, raw.to, 'relationship.to')
    if (!to.ok) return { ok: false, error: invalid(to.message) }
    const key = `${relType}|${from.value.table}.${from.value.column}|${to.value.table}.${to.value.column}`
    if (keys.has(key)) {
      return {
        ok: false,
        error: invalid(
          `relationship 重复：${from.value.table}.${from.value.column} → ${to.value.table}.${to.value.column}（${relType}）`
        )
      }
    }
    keys.add(key)
    relationships.push({ type: relType, from: from.value, to: to.value })
  }
  return { ok: true, value: relationships }
}

/** 聚合函数全集：计数、求和、均值、最小、最大 */
export const AGGREGATION_FUNCS = ['count', 'sum', 'avg', 'min', 'max'] as const
export type AggregationFunc = (typeof AGGREGATION_FUNCS)[number]

export interface AggregationSpec {
  func: AggregationFunc
  /** 聚合列（count 可省略：统计行数） */
  column?: string
}

export interface StatsQuery {
  table: string
  filter?: Record<string, RowValue>
  /** 分组维度列（缺省即整表一组） */
  groupBy?: string[]
  aggregations: AggregationSpec[]
}

export interface StatsGroup {
  /** 分组维度值（无 groupBy 时为空对象，即整表一组） */
  key: Record<string, RowValue>
  count: number
  /** 聚合结果：键为 count 或 `${func}__${column}`；无有效数值时为 null */
  values: Record<string, number | null>
}

export interface StatsResult {
  groups: StatsGroup[]
  /** 命中过滤条件的明细行 */
  rows: RowData[]
}

/** 校验统计请求：目标表存在、过滤/分组维度合法、聚合列必须是 number 列（count 除外） */
export function validateStatsQuery(
  db: AiDb,
  input: unknown
): { ok: true; value: StatsQuery } | { ok: false; error: ConnectorError } {
  if (!isRecord(input)) return { ok: false, error: invalid('请求体必须是 JSON 对象') }
  const tableName = isName(input.table)
  if (!tableName) return { ok: false, error: invalid(`table 必须是 1~${MAX_NAME_LENGTH} 字符`) }
  const table = db.tables.get(tableName)
  if (!table) return { ok: false, error: invalid(`统计目标表不存在：${tableName}`) }

  const query: StatsQuery = { table: tableName, aggregations: [] }

  if (input.filter !== undefined) {
    const filter = validateFilterInput(table, input.filter)
    if (!filter.ok) return filter
    query.filter = filter.value
  }

  if (input.groupBy !== undefined) {
    if (!Array.isArray(input.groupBy)) {
      return { ok: false, error: invalid('groupBy 必须是字符串数组') }
    }
    const dims: string[] = []
    const seen = new Set<string>()
    for (const raw of input.groupBy) {
      const dim = isName(raw)
      if (!dim) return { ok: false, error: invalid(`groupBy 维度必须是 1~${MAX_NAME_LENGTH} 字符`) }
      if (seen.has(dim)) return { ok: false, error: invalid(`groupBy 维度重复：${dim}`) }
      if (!findColumn(table, dim)) {
        return { ok: false, error: invalid(`groupBy 引用了不存在的列：${dim}（表 ${tableName}）`) }
      }
      seen.add(dim)
      dims.push(dim)
    }
    query.groupBy = dims
  }

  if (!Array.isArray(input.aggregations) || input.aggregations.length === 0) {
    return { ok: false, error: invalid('aggregations 必须是非空数组') }
  }
  if (input.aggregations.length > MAX_AGGREGATIONS) {
    return { ok: false, error: invalid(`aggregations 最多 ${MAX_AGGREGATIONS} 个`) }
  }
  for (const raw of input.aggregations) {
    if (!isRecord(raw)) return { ok: false, error: invalid('aggregation 必须是 JSON 对象') }
    if (typeof raw.func !== 'string' || !AGGREGATION_FUNCS.includes(raw.func as AggregationFunc)) {
      return {
        ok: false,
        error: invalid(`aggregation.func 必须是 ${AGGREGATION_FUNCS.join(' / ')} 之一`)
      }
    }
    const func = raw.func as AggregationFunc
    if (func === 'count') {
      query.aggregations.push({ func })
      continue
    }
    const column = isName(raw.column)
    if (!column) return { ok: false, error: invalid(`${func} 聚合必须提供 column`) }
    const columnDef = findColumn(table, column)
    if (!columnDef) {
      return {
        ok: false,
        error: invalid(`aggregation 引用了不存在的列：${column}（表 ${tableName}）`)
      }
    }
    if (columnDef.type !== 'number') {
      return { ok: false, error: invalid(`${func} 聚合只支持 number 列：${column}`) }
    }
    query.aggregations.push({ func, column })
  }
  return { ok: true, value: query }
}

/** 单列聚合：count 统计行数；sum/avg/min/max 只取非空数值，无有效值时为 null */
function aggregateColumn(rows: RowData[], spec: AggregationSpec): number | null {
  if (spec.func === 'count') return rows.length
  const numbers = rows
    .map((row) => row[spec.column as string])
    .filter((value): value is number => typeof value === 'number')
  if (numbers.length === 0) return null
  switch (spec.func) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0)
    case 'avg':
      return numbers.reduce((total, value) => total + value, 0) / numbers.length
    case 'min':
      return Math.min(...numbers)
    case 'max':
      return Math.max(...numbers)
  }
}

/** 统计分析纯函数：过滤 → 按维度分桶 → 逐桶聚合，返回分组序列与明细行 */
export function computeStats(allRows: RowData[], query: StatsQuery): StatsResult {
  const filter = query.filter ?? {}
  const rows = allRows.filter((row) => matchesFilter(row, filter))
  const dims = query.groupBy ?? []

  const buckets = new Map<string, { key: Record<string, RowValue>; rows: RowData[] }>()
  for (const row of rows) {
    const key: Record<string, RowValue> = {}
    for (const dim of dims) key[dim] = row[dim] ?? null
    const serialized = JSON.stringify(dims.map((dim) => key[dim]))
    const bucket = buckets.get(serialized) ?? { key, rows: [] }
    bucket.rows.push(row)
    buckets.set(serialized, bucket)
  }

  const groups: StatsGroup[] = [...buckets.values()].map((bucket) => {
    const values: Record<string, number | null> = {}
    for (const spec of query.aggregations) {
      values[spec.column ? `${spec.func}__${spec.column}` : spec.func] = aggregateColumn(
        bucket.rows,
        spec
      )
    }
    return { key: bucket.key, count: bucket.rows.length, values }
  })
  return { groups, rows }
}

/** 展示列：name 原列名，label 中文标题（comment 缺省回退列名） */
export interface DisplayColumn {
  name: string
  label: string
}

/** 行查询展示投影：columns 不含主键列；rows 与查询结果行一一对齐，外键列的值为关联名称，缺键归一为 null */
export interface QueryDisplay {
  columns: DisplayColumn[]
  rows: RowData[]
}

/** 统计展示投影：分组与聚合的中文标签 + 分组展示行 + 明细行投影 */
export interface StatsDisplay {
  /** 维度列名 → 中文标题 */
  dimensionLabels: Record<string, string>
  /** 聚合键（count / sum__列 …）→ 中文标签 */
  aggregationLabels: Record<string, string>
  /** 每组一行的展示对象，键为中文（维度标题 + 聚合标签），维度值为外键时已解析 */
  groupRows: RowData[]
  /** 明细行的展示投影 */
  detail: QueryDisplay
}

/** 展示标题：列 comment 缺省回退列名 */
function columnLabel(table: TableDef | undefined, columnName: string): string {
  return table?.columns.find((column) => column.name === columnName)?.comment ?? columnName
}

/** 外键规则：查询表的列作为某条 relationship 的 from 端即为外键列，值按 to 端解析 */
export interface ForeignKeyRule {
  /** 外键列名（from 端列） */
  column: string
  /** 被引端点（to 端表 + 列） */
  target: RelationshipEndpoint
}

/** 收集表的外键规则：作为某条 relationship from 端的列（同一列多条关系取首条） */
export function collectForeignKeyRules(db: AiDb, tableName: string): ForeignKeyRule[] {
  const seen = new Set<string>()
  const rules: ForeignKeyRule[] = []
  for (const rel of db.relationships) {
    if (rel.from.table !== tableName || seen.has(rel.from.column)) continue
    seen.add(rel.from.column)
    rules.push({ column: rel.from.column, target: rel.to })
  }
  return rules
}

/**
 * 外键值 → 展示值：在 to 端表行数据中找 `row[to.column] === 值` 的行，
 * 展示值取目标行首个 string 且非主键且非外键列的值；空值 / 无候选列 / 无匹配行回退原值。
 */
export function resolveForeignKeyValue(db: AiDb, rule: ForeignKeyRule, value: RowValue): RowValue {
  if (value === null) return null
  const targetTable = db.tables.get(rule.target.table)
  if (!targetTable) return value
  const targetForeignKeys = new Set(
    collectForeignKeyRules(db, rule.target.table).map((r) => r.column)
  )
  const displayColumn = targetTable.columns.find(
    (column) =>
      column.type === 'string' && !column.primaryKey && !targetForeignKeys.has(column.name)
  )
  if (!displayColumn) return value
  const matched = (db.rows.get(rule.target.table) ?? []).find(
    (row) => row[rule.target.column] === value
  )
  if (!matched) return value
  return matched[displayColumn.name] ?? null
}

/** 行查询展示投影：展示列去主键、label 取 comment（缺省列名），外键列解析为关联名称，其余原值 */
function buildQueryDisplay(db: AiDb, tableName: string, rows: RowData[]): QueryDisplay {
  const columns: DisplayColumn[] = (db.tables.get(tableName)?.columns ?? [])
    .filter((column) => !column.primaryKey)
    .map((column) => ({ name: column.name, label: column.comment ?? column.name }))
  const foreignKeys = new Map(
    collectForeignKeyRules(db, tableName).map((rule) => [rule.column, rule])
  )
  const displayRows = rows.map((row) => {
    const displayRow: RowData = {}
    for (const column of columns) {
      const value = row[column.name] ?? null
      const rule = foreignKeys.get(column.name)
      displayRow[column.name] = rule ? resolveForeignKeyValue(db, rule, value) : value
    }
    return displayRow
  })
  return { columns, rows: displayRows }
}

/** 聚合函数 → 中文标签：count → 计数，其余与列标题拼为 总和(标题) 形式 */
const AGGREGATION_FUNC_LABELS: Record<AggregationFunc, string> = {
  count: '计数',
  sum: '总和',
  avg: '平均',
  min: '最小',
  max: '最大'
}

/** 聚合键中文标签：count → 计数；sum/avg/min/max → 总和(标题) 等（标题 = comment 缺省列名） */
function aggregationLabel(table: TableDef | undefined, spec: AggregationSpec): string {
  const prefix = AGGREGATION_FUNC_LABELS[spec.func]
  return spec.column ? `${prefix}(${columnLabel(table, spec.column)})` : prefix
}

/** 统计展示投影：维度 / 聚合中文标签、分组展示行（维度外键解析）、明细行投影 */
function buildStatsDisplay(db: AiDb, query: StatsQuery, stats: StatsResult): StatsDisplay {
  const table = db.tables.get(query.table)
  const dims = query.groupBy ?? []

  const dimEntries = dims.map((dim) => [dim, columnLabel(table, dim)] as const)
  const dimensionLabels: Record<string, string> = Object.fromEntries(dimEntries)

  const aggregationLabels: Record<string, string> = {}
  for (const spec of query.aggregations) {
    const key = spec.column ? `${spec.func}__${spec.column}` : spec.func
    aggregationLabels[key] = aggregationLabel(table, spec)
  }

  const foreignKeys = new Map(
    collectForeignKeyRules(db, query.table).map((rule) => [rule.column, rule])
  )
  const groupRows = stats.groups.map((group) => {
    const displayRow: RowData = {}
    for (const [dim, label] of dimEntries) {
      const value = group.key[dim] ?? null
      const rule = foreignKeys.get(dim)
      displayRow[label] = rule ? resolveForeignKeyValue(db, rule, value) : value
    }
    for (const [key, label] of Object.entries(aggregationLabels)) {
      displayRow[label] = group.values[key] ?? null
    }
    return displayRow
  })

  return {
    dimensionLabels,
    aggregationLabels,
    groupRows,
    detail: buildQueryDisplay(db, query.table, stats.rows)
  }
}

function isEndpointValid(db: AiDb, endpoint: RelationshipEndpoint): boolean {
  return (
    db.tables.get(endpoint.table)?.columns.some((column) => column.name === endpoint.column) ??
    false
  )
}

/** 剪除两端引用已失效的关系，返回剪除条数 */
function pruneRelationships(db: AiDb): number {
  const before = db.relationships.length
  db.relationships = db.relationships.filter(
    (rel) => isEndpointValid(db, rel.from) && isEndpointValid(db, rel.to)
  )
  return before - db.relationships.length
}

/** 行值按新列定义裁剪：丢掉已删除列与类型不符的值（历史行收缩，避免悬挂引用） */
function trimRow(row: RowData, table: TableDef): RowData {
  const trimmed: RowData = {}
  for (const [key, value] of Object.entries(row)) {
    const column = findColumn(table, key)
    if (column && checkRowValue(value, column) === null) trimmed[key] = value
  }
  return trimmed
}

/** 新建表（调用方保证表名不重复且不超上限） */
export function addTable(db: AiDb, table: TableDef): void {
  db.tables.set(table.name, table)
  db.rows.set(table.name, [])
}

/** 整体替换表定义（table.name 不同于 oldName 即改名，级联更新关系引用），返回被剪除的关系条数 */
export function replaceTable(db: AiDb, oldName: string, table: TableDef): number {
  const existingRows = db.rows.get(oldName) ?? []
  db.tables.delete(oldName)
  db.rows.delete(oldName)
  if (oldName !== table.name) {
    for (const rel of db.relationships) {
      if (rel.from.table === oldName) rel.from = { table: table.name, column: rel.from.column }
      if (rel.to.table === oldName) rel.to = { table: table.name, column: rel.to.column }
    }
  }
  db.tables.set(table.name, table)
  db.rows.set(
    table.name,
    existingRows.map((row) => trimRow(row, table))
  )
  return pruneRelationships(db)
}

/** 删除表及其行数据与引用它的关系，返回删除的关系条数 */
export function removeTable(db: AiDb, name: string): number {
  db.tables.delete(name)
  db.rows.delete(name)
  const before = db.relationships.length
  db.relationships = db.relationships.filter(
    (rel) => rel.from.table !== name && rel.to.table !== name
  )
  return before - db.relationships.length
}

/** 追加行数据（调用方保证已通过 validateRowsInput） */
export function addRows(db: AiDb, name: string, rows: RowData[]): void {
  db.rows.get(name)?.push(...rows)
}

/** 全量覆盖关系（调用方保证已通过 validateRelationships） */
export function setRelationships(db: AiDb, relationships: RelationshipDef[]): void {
  db.relationships = relationships
}

/** 解析并校验 JSON 请求体；形状不合法已回 400 */
async function readJsonBody(
  c: Context
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: Response }> {
  let parsed: unknown
  try {
    parsed = await c.req.json()
  } catch {
    return { ok: false, response: c.json({ ok: false, error: invalid('请求体必须是 JSON') }, 400) }
  }
  if (!isRecord(parsed)) {
    return {
      ok: false,
      response: c.json({ ok: false, error: invalid('请求体必须是 JSON 对象') }, 400)
    }
  }
  return { ok: true, value: parsed }
}

/**
 * AI 建模内存库 Hono 子应用（9 个端点，缺资源 404、形状/引用非法 400），
 * 由 server/dev.ts 挂到 /ai-db；默认自带进程内单例库，测试可传入隔离实例。
 */
export function createAiDbApp(db: AiDb = createAiDb()): Hono {
  const app = new Hono()

  /** GET /tables — 全部表（含列定义） */
  app.get('/tables', (c) => c.json({ ok: true, tables: [...db.tables.values()] }))

  /** POST /tables — 新建表 */
  app.post('/tables', async (c) => {
    const body = await readJsonBody(c)
    if (!body.ok) return body.response
    const result = validateTableDef(body.value)
    if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
    if (db.tables.size >= MAX_TABLES) {
      return c.json({ ok: false, error: invalid(`内存库最多 ${MAX_TABLES} 张表`) }, 400)
    }
    if (db.tables.has(result.value.name)) {
      return c.json({ ok: false, error: invalid(`表已存在：${result.value.name}`) }, 400)
    }
    addTable(db, result.value)
    return c.json({ ok: true, table: result.value })
  })

  /** PUT /tables/:name — 更新表定义（body.name 不同于路径即改名） */
  app.put('/tables/:name', async (c) => {
    const name = c.req.param('name')
    if (!db.tables.has(name)) {
      return c.json({ ok: false, error: invalid(`表不存在：${name}`) }, 404)
    }
    const body = await readJsonBody(c)
    if (!body.ok) return body.response
    const result = validateTableDef(body.value)
    if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
    if (result.value.name !== name && db.tables.has(result.value.name)) {
      return c.json({ ok: false, error: invalid(`表已存在：${result.value.name}`) }, 400)
    }
    const prunedRelationships = replaceTable(db, name, result.value)
    return c.json({ ok: true, table: result.value, prunedRelationships })
  })

  /** DELETE /tables/:name — 删除表（连带行数据与引用它的关系） */
  app.delete('/tables/:name', (c) => {
    const name = c.req.param('name')
    if (!db.tables.has(name)) {
      return c.json({ ok: false, error: invalid(`表不存在：${name}`) }, 404)
    }
    const removedRelationships = removeTable(db, name)
    return c.json({ ok: true, removedRelationships })
  })

  /** POST /tables/:name/rows — 批量插入行数据 */
  app.post('/tables/:name/rows', async (c) => {
    const name = c.req.param('name')
    const table = db.tables.get(name)
    if (!table) return c.json({ ok: false, error: invalid(`表不存在：${name}`) }, 404)
    const body = await readJsonBody(c)
    if (!body.ok) return body.response
    const result = validateRowsInput(table, db.rows.get(name) ?? [], body.value)
    if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
    addRows(db, name, result.value)
    return c.json({
      ok: true,
      inserted: result.value.length,
      total: db.rows.get(name)?.length ?? 0
    })
  })

  /** GET /tables/:name/rows — 查询行数据（?filter={"列":值} 受控等值过滤，响应含 display 展示投影） */
  app.get('/tables/:name/rows', (c) => {
    const name = c.req.param('name')
    const table = db.tables.get(name)
    if (!table) return c.json({ ok: false, error: invalid(`表不存在：${name}`) }, 404)
    let filter: Record<string, RowValue> = {}
    const raw = c.req.query('filter')
    if (raw !== undefined) {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return c.json({ ok: false, error: invalid('filter 必须是合法 JSON 对象') }, 400)
      }
      const result = validateFilterInput(table, parsed)
      if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
      filter = result.value
    }
    const rows = (db.rows.get(name) ?? []).filter((row) => matchesFilter(row, filter))
    return c.json({
      ok: true,
      rows,
      total: rows.length,
      display: buildQueryDisplay(db, name, rows)
    })
  })

  /** POST /stats — 统计分析（过滤 + 分组维度 + 聚合，返回分组序列、明细行与 display 展示投影） */
  app.post('/stats', async (c) => {
    const body = await readJsonBody(c)
    if (!body.ok) return body.response
    const result = validateStatsQuery(db, body.value)
    if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
    const stats = computeStats(db.rows.get(result.value.table) ?? [], result.value)
    return c.json({
      ok: true,
      groups: stats.groups,
      rows: stats.rows,
      display: buildStatsDisplay(db, result.value, stats)
    })
  })

  /** GET /relationships — 全部实体关系 */
  app.get('/relationships', (c) => c.json({ ok: true, relationships: db.relationships }))

  /** PUT /relationships — 全量覆盖实体关系（引用的表/列必须已存在） */
  app.put('/relationships', async (c) => {
    const body = await readJsonBody(c)
    if (!body.ok) return body.response
    const result = validateRelationships(db, body.value)
    if (!result.ok) return c.json({ ok: false, error: result.error }, 400)
    setRelationships(db, result.value)
    return c.json({ ok: true, relationships: result.value })
  })

  return app
}

/** 进程内单例子应用：server/dev.ts 挂载到 /ai-db */
export const aiDbApp = createAiDbApp()
