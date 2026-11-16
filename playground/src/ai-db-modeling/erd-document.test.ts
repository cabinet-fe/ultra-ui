import { describe, expect, it } from 'vite-plus/test'

import type { RelationshipDef, TableDef } from './api'
import { toErdDocumentValue } from './erd-document'

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

  it('表网格坐标互不重叠（首行两表横向错开）', () => {
    const doc = parseDocument()
    const { x: x1 } = doc.collections.tableEntities['t:author'].ui
    const { x: x2 } = doc.collections.tableEntities['t:post'].ui

    expect(x1).not.toBe(x2)
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
