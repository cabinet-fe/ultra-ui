/**
 * 库内表 + 关系 → erd-editor 只读 viewer 的 v3 storage 文档（JSON 字符串）。
 * viewer 的 value 只认该格式（DBML / SQL 仅为编辑器导入格式，viewer 不解析），
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

/** 表格布局：每行列数与列间距（viewer 自动 fit，只需保证不重叠） */
const GRID_COLUMNS = 3
const GRID_GAP_X = 420
const GRID_GAP_Y = 60
/** 单表估算高度：表头 + 列行高 */
const TABLE_BASE_HEIGHT = 60
const COLUMN_ROW_HEIGHT = 30

const tableId = (name: string) => `t:${name}`
const columnId = (tableName: string, columnName: string) => `c:${tableName}:${columnName}`

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

/** 表格网格坐标：行高取该行最高表，避免列数悬殊的表重叠 */
function gridPositions(tables: TableDef[]): Array<{ x: number; y: number }> {
  const rowCount = Math.ceil(tables.length / GRID_COLUMNS)
  const rowHeights = Array.from({ length: rowCount }, (_, row) => {
    const columnsInRow = tables
      .filter((_, index) => Math.floor(index / GRID_COLUMNS) === row)
      .reduce((max, table) => Math.max(max, table.columns.length), 0)
    return TABLE_BASE_HEIGHT + columnsInRow * COLUMN_ROW_HEIGHT
  })

  const rowOffsets = [0]
  for (let row = 1; row < rowCount; row++) {
    rowOffsets.push(rowOffsets[row - 1]! + rowHeights[row - 1]! + GRID_GAP_Y)
  }

  return tables.map((_, index) => ({
    x: (index % GRID_COLUMNS) * GRID_GAP_X,
    y: rowOffsets[Math.floor(index / GRID_COLUMNS)] ?? 0
  }))
}

/** 转成 viewer `value` 可直接消费的文档字符串；空库产出空文档（viewer 渲染空画布） */
export function toErdDocumentValue(tables: TableDef[], relationships: RelationshipDef[]): string {
  const tablesByName = new Map(tables.map((table) => [table.name, table]))
  const positions = gridPositions(tables)

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
