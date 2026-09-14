import { describe, expect, it } from 'vitest'

import { ColumnNode } from '../node/col'

describe('ColumnNode column styles', () => {
  it('headerAlign 未指定时回退到 align', () => {
    const column = new ColumnNode({ key: 'a', name: 'A', align: 'center' }, 0, 0)

    expect(column.headerAlign).toBe('center')
  })

  it('headerAlign 显式指定时优先于 align', () => {
    const column = new ColumnNode(
      { key: 'a', name: 'A', align: 'center', headerAlign: 'right' },
      0,
      0
    )

    expect(column.headerAlign).toBe('right')
  })

  it('headerCellStyle 未指定 headerStyle 时回退到 style', () => {
    const column = new ColumnNode(
      { key: 'a', name: 'A', style: { color: 'red', fontSize: 14 } },
      0,
      0
    )

    expect(column.cellStyle).toEqual({ color: 'red', fontSize: '14px' })
    expect(column.headerCellStyle).toEqual({ color: 'red', fontSize: '14px' })
  })

  it('headerCellStyle 显式指定 headerStyle 时优先于 style', () => {
    const column = new ColumnNode(
      {
        key: 'a',
        name: 'A',
        style: { color: 'red', fontSize: 12 },
        headerStyle: { color: 'blue', fontSize: 16 }
      },
      0,
      0
    )

    expect(column.cellStyle).toEqual({ color: 'red', fontSize: '12px' })
    expect(column.headerCellStyle).toEqual({ color: 'blue', fontSize: '16px' })
  })

  it('fontSize 数字转为 px，字符串原样保留', () => {
    const column = new ColumnNode({ key: 'a', name: 'A', style: { fontSize: 18 } }, 0, 0)
    const columnWithUnit = new ColumnNode(
      { key: 'b', name: 'B', style: { fontSize: '1.2rem' } },
      0,
      0
    )

    expect(column.cellStyle).toEqual({ fontSize: '18px' })
    expect(columnWithUnit.cellStyle).toEqual({ fontSize: '1.2rem' })
  })

  it('未配置样式时 getter 返回 undefined', () => {
    const column = new ColumnNode({ key: 'a', name: 'A' }, 0, 0)

    expect(column.cellStyle).toBeUndefined()
    expect(column.headerCellStyle).toBeUndefined()
  })
})
