import { describe, expect, it } from 'vite-plus/test'

import type { RelationshipDef, TableDef } from './api'
import { tableSize, toErdDocumentValue } from './erd-document'

/** 列选项位标记（ColumnOption.primaryKey / notNull），与实现内常量对应 */
const PRIMARY_KEY = 2
const NOT_NULL = 8

const tables: TableDef[] = [
  {
    name: 'author',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'name', type: 'string' }
    ]
  },
  {
    name: 'post',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'author_id', type: 'number' },
      { name: 'title', type: 'string', nullable: true }
    ]
  }
]

const relationships: RelationshipDef[] = [
  {
    type: '1-n',
    from: { table: 'post', column: 'author_id' },
    to: { table: 'author', column: 'id' }
  },
  { type: '1-1', from: { table: 'post', column: 'title' }, to: { table: 'author', column: 'id' } },
  { type: 'n-n', from: { table: 'post', column: 'id' }, to: { table: 'author', column: 'id' } }
]

/** 模块分区布局用例：商品 4 表（区块内 2 行）、会员 2 表、未分组 2 表 */
const groupedTables: TableDef[] = [
  {
    name: 'product',
    module: '商品',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'name', type: 'string' },
      { name: 'category_id', type: 'number' },
      { name: 'brand_id', type: 'number' }
    ]
  },
  {
    name: 'category',
    module: '商品',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'name', type: 'string' }
    ]
  },
  {
    name: 'brand',
    module: '商品',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'name', type: 'string' }
    ]
  },
  {
    name: 'sku',
    module: '商品',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'product_id', type: 'number' },
      { name: 'price', type: 'number', nullable: true }
    ]
  },
  {
    name: 'member',
    module: '会员',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'nickname', type: 'string' },
      { name: 'level_id', type: 'number' }
    ]
  },
  {
    name: 'member_level',
    module: '会员',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'title', type: 'string' }
    ]
  },
  {
    name: 'audit_log',
    columns: [
      { name: 'id', type: 'number', primaryKey: true },
      { name: 'action', type: 'string' }
    ]
  },
  { name: 'migration_history', columns: [{ name: 'id', type: 'number', primaryKey: true }] }
]

type Box = { left: number; top: number; right: number; bottom: number }

/** 按估算宽高（实现导出的 tableSize）算各表包围盒 */
function tableBoxes(tableDefs: TableDef[]): Map<string, Box> {
  const doc = JSON.parse(toErdDocumentValue(tableDefs, []))
  const boxes = new Map<string, Box>()
  for (const table of tableDefs) {
    const { x, y } = doc.collections.tableEntities[`t:${table.name}`].ui
    const { width, height } = tableSize(table)
    boxes.set(table.name, { left: x, top: y, right: x + width, bottom: y + height })
  }
  return boxes
}

function union(boxes: Box[]): Box {
  return {
    left: Math.min(...boxes.map((box) => box.left)),
    top: Math.min(...boxes.map((box) => box.top)),
    right: Math.max(...boxes.map((box) => box.right)),
    bottom: Math.max(...boxes.map((box) => box.bottom))
  }
}

function overlap(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/** 两不相交包围盒的间隔（网格语义：水平 / 垂直间距的较大者） */
function separation(a: Box, b: Box): number {
  const dx = Math.max(a.left - b.right, b.left - a.right, 0)
  const dy = Math.max(a.top - b.bottom, b.top - a.bottom, 0)
  return Math.max(dx, dy)
}

function parseDocument(
  tableDefs: TableDef[] = tables,
  relDefs: RelationshipDef[] = relationships
): Record<string, any> {
  return JSON.parse(toErdDocumentValue(tableDefs, relDefs))
}

describe('toErdDocumentValue', () => {
  it('产出 v3 storage 文档：表/列实体齐全，主键与非空落选项位标记', () => {
    const doc = parseDocument()

    expect(doc.version).toBe('3.0.0')
    expect(doc.doc.tableIds).toEqual(['t:author', 't:post'])

    const author = doc.collections.tableEntities['t:author']
    expect(author.columnIds).toEqual(['c:author:id', 'c:author:name'])

    const columns = doc.collections.tableColumnEntities
    expect(columns['c:author:id'].options).toBe(PRIMARY_KEY | NOT_NULL)
    expect(columns['c:author:name'].options).toBe(NOT_NULL)
    expect(columns['c:post:title'].options).toBe(0)
    expect(columns['c:post:title'].dataType).toBe('VARCHAR(255)')
    expect(columns['c:author:id'].dataType).toBe('INT')
  })

  it('布局：任意两表包围盒（按估算宽高）互不重叠', () => {
    const boxes = [...tableBoxes(groupedTables).values()]

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i]!, boxes[j]!)).toBe(false)
      }
    }
  })

  it('布局：同模块表聚集同一区块，区块间距大于区块内表间距', () => {
    const boxes = tableBoxes(groupedTables)
    const product = union(['product', 'category', 'brand', 'sku'].map((name) => boxes.get(name)!))
    const member = union(['member', 'member_level'].map((name) => boxes.get(name)!))

    // 区块内相邻表间距（商品区块首行前两张表）
    const intraGap = separation(boxes.get('product')!, boxes.get('category')!)
    expect(intraGap).toBeGreaterThan(0)

    expect(overlap(product, member)).toBe(false)
    expect(separation(product, member)).toBeGreaterThan(intraGap)
  })

  it('布局：无 module 表归未分组区块，与其它区块分开', () => {
    const boxes = tableBoxes(groupedTables)
    const ungrouped = union(['audit_log', 'migration_history'].map((name) => boxes.get(name)!))
    const grouped = union(
      [...boxes.keys()]
        .filter((name) => name !== 'audit_log' && name !== 'migration_history')
        .map((name) => boxes.get(name)!)
    )

    // 未分组两表同区块相邻，整体与其它模块区块分开且间隔更大
    const intraGap = separation(boxes.get('audit_log')!, boxes.get('migration_history')!)
    expect(intraGap).toBeGreaterThan(0)
    expect(overlap(ungrouped, grouped)).toBe(false)
    expect(separation(ungrouped, grouped)).toBeGreaterThan(intraGap)
  })

  it('关系对调两端（start=被引用端 to、end=外键端 from）并按类型与可空性落基数', () => {
    const doc = parseDocument()
    const rels = doc.collections.relationshipEntities

    // 1-n 外键非空 → OneN（crow foot 画在外键端）
    expect(rels['r:0'].relationshipType).toBe(16)
    expect(rels['r:0'].start).toEqual({ tableId: 't:author', columnIds: ['c:author:id'] })
    expect(rels['r:0'].end).toEqual({ tableId: 't:post', columnIds: ['c:post:author_id'] })

    // 1-1 外键可空 → ZeroOne
    expect(rels['r:1'].relationshipType).toBe(2)

    // n-n 无对等记法，按 1-n 落 crow foot（外键 id 非空 → OneN）
    expect(rels['r:2'].relationshipType).toBe(16)

    expect(doc.doc.relationshipIds).toEqual(['r:0', 'r:1', 'r:2'])
  })

  it('空库产出空文档', () => {
    const doc = parseDocument([], [])

    expect(doc.version).toBe('3.0.0')
    expect(doc.doc.tableIds).toEqual([])
    expect(doc.doc.relationshipIds).toEqual([])
    expect(Object.keys(doc.collections.tableEntities)).toHaveLength(0)
  })
})
