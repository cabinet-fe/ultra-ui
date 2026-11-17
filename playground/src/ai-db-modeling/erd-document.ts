/**
 * 库内表 + 关系 → erd-editor 的 v3 storage 文档（JSON 字符串）。
 * er-view.vue 以完整 erd-editor 消费（不设 readonly，允许拖拽调整，编辑不回写服务端），
 * value 只认该格式（DBML / SQL 仅为编辑器导入格式，不经本模块），
 * 契约镜像 @dineug/erd-editor v5 内置的 erd-editor-schema（未单独发 npm 包）。
 */
import type { ColumnType, RelationshipDef, TableDef } from './api'

/** 列选项位标记（ColumnOption.primaryKey / notNull） */
const PRIMARY_KEY = 2
const NOT_NULL = 8

/**
 * 关系端基数（画在关系线 end 端）。erd 约定 start = 被引用端、end = 外键端，
 * 与 API 的 from（外键端）/ to（被引用端）相反，转换时需对调。
 */
const CARDINALITY = { zeroOne: 2, oneOnly: 8, zeroN: 4, oneN: 16 } as const

/** 列类型 → 展示用 SQL 数据类型 */
const DATA_TYPES: Record<ColumnType, string> = {
  string: 'VARCHAR(255)',
  number: 'INT',
  boolean: 'BOOLEAN',
  date: 'DATE'
}

/** 模块分区布局：区块内网格每行列数；区块自身也按网格排布（每行区块数） */
const BLOCK_TABLE_COLUMNS = 3
const BLOCK_COLUMNS = 3
/** 区块内表间距与区块间距（独立常量，区块间距明显更大以分隔模块） */
const TABLE_GAP_X = 100
const TABLE_GAP_Y = 60
const BLOCK_GAP_X = 480
const BLOCK_GAP_Y = 360
/** 无 module 表归属的区块名 */
const UNGROUPED_MODULE = '未分组'
/** 单表估算尺寸：宽 = 基础宽 + 最长行文本（表名 / 列名+类型）字符宽，高 = 表头 + 列行高 */
const TABLE_BASE_WIDTH = 140
const CHAR_WIDTH = 9
const TABLE_BASE_HEIGHT = 60
const COLUMN_ROW_HEIGHT = 30

const tableId = (name: string) => `t:${name}`
const columnId = (tableName: string, columnName: string) => `c:${tableName}:${columnName}`

/** 画布坐标 */
type Position = { x: number; y: number }

/**
 * 关系类型 + 外键可空性 → end 端基数：
 * 1-1 / 1-n 按外键 nullable 取 0.. 或 1.. 变体；n-n 记法不存在鸦脚对等物，按 1-n 落 crow foot。
 */
function endCardinality(
  relationship: RelationshipDef,
  tablesByName: Map<string, TableDef>
): number {
  const fkColumn = tablesByName
    .get(relationship.from.table)
    ?.columns.find((column) => column.name === relationship.from.column)
  const nullable = fkColumn?.nullable ?? false
  if (relationship.type === '1-1') return nullable ? CARDINALITY.zeroOne : CARDINALITY.oneOnly
  return nullable ? CARDINALITY.zeroN : CARDINALITY.oneN
}

/** 单表估算尺寸：宽按最长行文本（表名 / 列名+类型），高按表头 + 列行高 */
export function tableSize(table: TableDef): { width: number; height: number } {
  const textLength = Math.max(
    table.name.length,
    ...table.columns.map((column) => column.name.length + DATA_TYPES[column.type].length + 1)
  )
  return {
    width: TABLE_BASE_WIDTH + textLength * CHAR_WIDTH,
    height: TABLE_BASE_HEIGHT + table.columns.length * COLUMN_ROW_HEIGHT
  }
}

/** 区块内网格摆放：列间距按表估算宽度推进，行推进取该行最高表；返回各表坐标与区块尺寸 */
function layoutBlock(tables: TableDef[]): {
  positions: Map<string, Position>
  size: { width: number; height: number }
} {
  const positions = new Map<string, Position>()
  let y = 0
  let width = 0
  for (let row = 0; row * BLOCK_TABLE_COLUMNS < tables.length; row++) {
    const rowTables = tables.slice(row * BLOCK_TABLE_COLUMNS, (row + 1) * BLOCK_TABLE_COLUMNS)
    let x = 0
    let rowHeight = 0
    for (const table of rowTables) {
      const { width: tableWidth, height: tableHeight } = tableSize(table)
      positions.set(table.name, { x, y })
      x += tableWidth + TABLE_GAP_X
      rowHeight = Math.max(rowHeight, tableHeight)
    }
    width = Math.max(width, x - TABLE_GAP_X)
    y += rowHeight + TABLE_GAP_Y
  }
  return { positions, size: { width, height: y - TABLE_GAP_Y } }
}

/**
 * 模块分区布局：按 module 分桶（缺省归未分组），同模块表在同一区块内网格摆放，
 * 区块按网格排布且区块间距明显大于区块内表间距——「有关联的表放一起」由同模块相邻实现。
 */
function modulePositions(tables: TableDef[]): Position[] {
  const buckets = new Map<string, TableDef[]>()
  for (const table of tables) {
    const moduleName = table.module?.trim() || UNGROUPED_MODULE
    const bucket = buckets.get(moduleName)
    if (bucket) bucket.push(table)
    else buckets.set(moduleName, [table])
  }

  const blocks = [...buckets.values()].map((bucket) => layoutBlock(bucket))
  const positions = new Map<string, Position>()
  let x = 0
  let y = 0
  let rowHeight = 0
  blocks.forEach((block, index) => {
    if (index > 0 && index % BLOCK_COLUMNS === 0) {
      x = 0
      y += rowHeight + BLOCK_GAP_Y
      rowHeight = 0
    }
    for (const [name, position] of block.positions) {
      positions.set(name, { x: x + position.x, y: y + position.y })
    }
    x += block.size.width + BLOCK_GAP_X
    rowHeight = Math.max(rowHeight, block.size.height)
  })

  return tables.map((table) => positions.get(table.name)!)
}

/** 转成 viewer `value` 可直接消费的文档字符串；空库产出空文档（viewer 渲染空画布） */
export function toErdDocumentValue(tables: TableDef[], relationships: RelationshipDef[]): string {
  const tablesByName = new Map(tables.map((table) => [table.name, table]))
  const positions = modulePositions(tables)

  const tableEntities: Record<string, unknown> = {}
  const tableColumnEntities: Record<string, unknown> = {}
  tables.forEach((table, index) => {
    tableEntities[tableId(table.name)] = {
      id: tableId(table.name),
      name: table.name,
      columnIds: table.columns.map((column) => columnId(table.name, column.name)),
      ui: positions[index]
    }
    for (const column of table.columns) {
      tableColumnEntities[columnId(table.name, column.name)] = {
        id: columnId(table.name, column.name),
        tableId: tableId(table.name),
        name: column.name,
        dataType: DATA_TYPES[column.type],
        comment: column.comment ?? '',
        options: (column.primaryKey ? PRIMARY_KEY : 0) | (column.nullable ? 0 : NOT_NULL)
      }
    }
  })

  const relationshipEntities: Record<string, unknown> = {}
  relationships.forEach((relationship, index) => {
    const id = `r:${index}`
    relationshipEntities[id] = {
      id,
      relationshipType: endCardinality(relationship, tablesByName),
      start: {
        tableId: tableId(relationship.to.table),
        columnIds: [columnId(relationship.to.table, relationship.to.column)]
      },
      end: {
        tableId: tableId(relationship.from.table),
        columnIds: [columnId(relationship.from.table, relationship.from.column)]
      }
    }
  })

  return JSON.stringify({
    $schema: 'https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json',
    version: '3.0.0',
    doc: {
      tableIds: tables.map((table) => tableId(table.name)),
      relationshipIds: relationships.map((_, index) => `r:${index}`)
    },
    collections: { tableEntities, tableColumnEntities, relationshipEntities }
  })
}
