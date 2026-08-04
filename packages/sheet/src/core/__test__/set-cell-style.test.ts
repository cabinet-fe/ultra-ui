import { describe, expect, it, vi } from 'vitest'

import { iterateRange, parseRange } from '../address'
import { mergeCellStyle } from '../command/set-cell-style'
import { Sheet } from '../sheet'

const B2 = { row: 1, col: 1 }
const C3 = { row: 2, col: 2 }
const B2C3 = parseRange('B2:C3')!

describe('mergeCellStyle 部分合并语义', () => {
  it('只给 fill 保留既有 border；只给 border 保留既有 fill', () => {
    const base = {
      fill: { color: '#FF0000' },
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    }
    expect(mergeCellStyle(base, { fill: { color: '#00FF00' } })).toEqual({
      fill: { color: '#00FF00' },
      border: base.border
    })
    expect(
      mergeCellStyle(base, { border: { bottom: { style: 'thick', width: 3, color: '#111111' } } })
    ).toEqual({
      fill: base.fill,
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    })
  })

  it('border 字段存在 = 边级合并：未给出边保留，给出边与既有边合并', () => {
    const base = {
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    }
    // 只改 top 的颜色/线型 → 其余边（bottom）保留
    expect(
      mergeCellStyle(base, { border: { top: { style: 'dashed', color: '#FF0000' } } })
    ).toEqual({
      border: {
        top: { style: 'dashed', width: 1, color: '#FF0000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    })
  })

  it('边值为 null = 删除该边（其余边保留）；四边全 null = 清除全部边框', () => {
    const base = {
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    }
    expect(mergeCellStyle(base, { border: { bottom: null } })).toEqual({
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })
    // 显式四边 null = 重定义为空集合（无边框预设的表达）
    expect(
      mergeCellStyle(base, { border: { top: null, right: null, bottom: null, left: null } })
    ).toBeUndefined()
    // 无既有边时 null 为无操作
    expect(mergeCellStyle(undefined, { border: { left: null } })).toBeUndefined()
  })

  it('border: {} 无边变化（未列出边保留）；fill: {} 清除填充（保留边框）', () => {
    const base = {
      fill: { color: '#FF0000' },
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    }
    expect(mergeCellStyle(base, { border: {} })).toEqual(base)
    expect(mergeCellStyle(base, { fill: {} })).toEqual({ border: base.border })
    expect(mergeCellStyle(base, { fill: {}, border: {} })).toEqual({ border: base.border })
  })

  it('无既有边时缺失边字段用默认值补全（thin / 1px / #000000）', () => {
    expect(mergeCellStyle(undefined, { border: { left: { color: '#AABBCC' } } })).toEqual({
      border: { left: { style: 'thin', width: 1, color: '#AABBCC' } }
    })
  })

  it('缺失边字段保留既有边值（非默认值场景；无既有边才用默认值）', () => {
    const base = { border: { top: { style: 'thick', width: 3, color: '#111111' } } }
    // 只给 color → style/width 保留既有 thick/3（而非回落默认 thin/1）
    expect(mergeCellStyle(base, { border: { top: { color: '#FF0000' } } })).toEqual({
      border: { top: { style: 'thick', width: 3, color: '#FF0000' } }
    })
    // 只给 width → style/color 保留既有
    expect(mergeCellStyle(base, { border: { top: { width: 5 } } })).toEqual({
      border: { top: { style: 'thick', width: 5, color: '#111111' } }
    })
  })

  it('空补丁（无 fill 无 border）= 无变化', () => {
    const base = { fill: { color: '#FF0000' } }
    expect(mergeCellStyle(base, {})).toEqual(base)
    expect(mergeCellStyle(undefined, {})).toBeUndefined()
  })

  it('font/align 逐字段浅合并；font:{} / align:{} 清除该类；null 删字段', () => {
    const base = {
      fill: { color: '#FF0000' },
      font: { color: '#0000FF', bold: true, size: 12 },
      align: { horizontal: 'center' as const, wrap: true }
    }
    expect(mergeCellStyle(base, { font: { italic: true } })).toEqual({
      fill: base.fill,
      font: { color: '#0000FF', bold: true, italic: true, size: 12 },
      align: base.align
    })
    expect(mergeCellStyle(base, { font: { color: null } })).toEqual({
      fill: base.fill,
      font: { bold: true, size: 12 },
      align: base.align
    })
    expect(mergeCellStyle(base, { font: {} })).toEqual({ fill: base.fill, align: base.align })
    expect(mergeCellStyle(base, { align: { horizontal: null, vertical: 'top' } })).toEqual({
      fill: base.fill,
      font: base.font,
      align: { wrap: true, vertical: 'top' }
    })
    expect(mergeCellStyle(base, { align: {} })).toEqual({ fill: base.fill, font: base.font })
  })
})

describe('SetCellStyleCommand（经 Sheet）', () => {
  it('填充色：单元格存 StyleId，样式池去重共享一份定义', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    expect(sheet.getCellData(B2)!.s).toBe(sheet.getCellData(C3)!.s)
    expect(sheet.stylePool.size).toBe(1)
    expect(sheet.getCellStyle(B2)).toEqual({ fill: { color: '#FF0000' } })
  })

  it('font/align 写入 + undo/redo 还原', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(B2C3, {
      font: { color: '#FF0000', bold: true, size: 14 },
      align: { horizontal: 'center', wrap: true }
    })
    expect(sheet.getCellStyle(B2)).toEqual({
      font: { color: '#FF0000', bold: true, size: 14 },
      align: { horizontal: 'center', wrap: true }
    })
    sheet.setCellStyle(B2C3, { font: { italic: true } })
    expect(sheet.getCellStyle(B2)?.font).toEqual({
      color: '#FF0000',
      bold: true,
      italic: true,
      size: 14
    })
    sheet.undo()
    expect(sheet.getCellStyle(B2)?.font?.italic).toBeUndefined()
    sheet.undo()
    expect(sheet.getCellStyle(B2)).toBeUndefined()
    sheet.redo()
    expect(sheet.getCellStyle(B2)?.font?.bold).toBe(true)
  })

  it('部分合并：先设 fill+border，再只改 fill → border 保留', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(B2C3, {
      fill: { color: '#FFEE00' },
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    })
    sheet.setCellStyle(B2C3, { fill: { color: '#00FF00' } })
    expect(sheet.getCellStyle(B2)).toEqual({
      fill: { color: '#00FF00' },
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'thick', width: 3, color: '#111111' }
      }
    })
  })

  it('undo/redo 精确恢复 before/after（含纯样式格）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'hello')
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    const styledB2 = sheet.getCellData(B2)
    const styledC3 = sheet.getCellData(C3)
    expect(styledC3).toEqual({ s: styledB2!.s })

    sheet.undo()
    expect(sheet.getCellData(B2)).toEqual({ v: 'hello', t: 's' })
    expect(sheet.getCellData(C3)).toBeUndefined()

    sheet.redo()
    expect(sheet.getCellData(B2)).toEqual(styledB2)
    expect(sheet.getCellData(C3)).toEqual(styledC3)
  })

  it('批量选区 = 单 undo 单元', () => {
    const sheet = new Sheet()
    const range = parseRange('A1:E10')! // 50 格
    sheet.setCellStyle(range, { fill: { color: '#FF0000' } })
    expect(sheet.history.undoSize).toBe(1)

    sheet.undo()
    expect(sheet.store.size).toBe(0)
    sheet.redo()
    expect(sheet.store.size).toBe(50)
  })

  it('空样式删除 s 字段：有值格保留值，纯样式格整体删除', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'keep')
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    sheet.clearCellStyle(B2C3)
    expect(sheet.getCellData(B2)).toEqual({ v: 'keep', t: 's' })
    expect(sheet.getCellData(C3)).toBeUndefined()

    // undo 恢复样式
    sheet.undo()
    expect(sheet.getCellData(B2)).toMatchObject({ s: 1 })
    expect(sheet.getCellData(C3)).toMatchObject({ s: 1 })
  })

  it('无填充（fill: {}）保留边框；四边 null 清除全部边框（保留填充）', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(B2C3, {
      fill: { color: '#FF0000' },
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })
    sheet.setCellStyle(B2C3, { fill: {} })
    expect(sheet.getCellStyle(B2)).toEqual({
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })
    sheet.setCellStyle(B2C3, { border: { top: null, right: null, bottom: null, left: null } })
    expect(sheet.getCellData(B2)).toBeUndefined()
  })

  it('clearCellStyle 对无样式区域为 no-op（不入历史）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'v')
    const historySize = sheet.history.undoSize
    sheet.clearCellStyle(B2C3)
    expect(sheet.getCellData(B2)).toEqual({ v: 'v', t: 's' })
    expect(sheet.history.undoSize).toBe(historySize)
    // 有样式时清除 → 入历史，undo 撤销清除恢复样式
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    sheet.clearCellStyle(B2C3)
    expect(sheet.history.undoSize).toBe(historySize + 2)
    sheet.undo()
    expect(sheet.getCellStyle(B2)).toEqual({ fill: { color: '#FF0000' } })
  })

  it('编辑值 / 公式保留既有样式；清除值删除整格（含样式）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'old')
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })

    // 改值
    sheet.setCellValue(B2, 'new')
    expect(sheet.getCellData(B2)).toEqual({ v: 'new', t: 's', s: 1 })

    // 写公式（派生补丁也保留样式）
    sheet.setCellValue(C3, '=B2')
    expect(sheet.getCellData(C3)).toMatchObject({ f: 'B2', s: 1 })
    expect(sheet.getCellData(C3)?.v).toBe('new')

    // 清除值 → 整格删除（空单元格不占存储）
    sheet.setCellValue(B2, null)
    expect(sheet.getCellData(B2)).toBeUndefined()
  })

  it('setCell 显式带 s 时覆盖既有样式（不带则保留）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'old')
    sheet.setCellStyle({ start: B2, end: B2 }, { fill: { color: '#FF0000' } })
    const oldS = sheet.getCellData(B2)!.s!

    // 不带 s → 保留既有样式
    sheet.setCell(B2, { v: 'keep', t: 's' })
    expect(sheet.getCellData(B2)!.s).toBe(oldS)

    // 显式带 s → 覆盖既有样式
    const newS = sheet.stylePool.intern({ fill: { color: '#00FF00' } })
    sheet.setCell(B2, { v: 'cover', t: 's', s: newS })
    expect(sheet.getCellData(B2)!.s).toBe(newS)
    expect(sheet.getCellStyle(B2)).toEqual({ fill: { color: '#00FF00' } })
  })

  it('仅样式变化不触发公式重算（v/t/f 相同则跳过 recalc）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 2)
    sheet.setCellValue({ row: 0, col: 1 }, '=A1*2')
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe(4)
    sheet.history.clear()

    sheet.setCellStyle(parseRange('A1:B1')!, { fill: { color: '#FF0000' } })
    expect(sheet.history.undoSize).toBe(1)
    // 无重算副作用：公式缓存不变
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 4 })

    sheet.undo()
    sheet.redo()
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe(4)
  })

  it('样式变化触发 cell-change 事件（grid 重绘复用）', () => {
    const sheet = new Sheet()
    const handler = vi.fn()
    sheet.on('cell-change', handler)

    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    expect(handler).toHaveBeenCalledWith({ addr: B2 })
    expect(handler).toHaveBeenCalledWith({ addr: C3 })
  })

  it('合并格：样式只存锚点，被覆盖格经 resolveAnchor 落锚点', () => {
    const sheet = new Sheet()
    sheet.mergeCells(B2C3)
    sheet.setCellStyle({ start: C3, end: C3 }, { fill: { color: '#FF0000' } })
    expect(sheet.getCellData(B2)).toMatchObject({ s: 1 })
    expect(sheet.getCellData(C3)).toBeUndefined()
    expect(sheet.getCellStyle(C3)).toBeUndefined() // 原始存储语义
  })

  it('存储体积：100 格同一填充色 → 样式定义仅 1 份、每格只存 id', () => {
    const sheet = new Sheet()
    const range = parseRange('A1:J10')! // 100 格
    sheet.setCellStyle(range, { fill: { color: '#FFAA00' } })
    expect(sheet.stylePool.size).toBe(1)

    const cells = sheet.store.snapshot()
    expect(cells).toHaveLength(100)
    for (const cell of cells) expect(cell.s).toBe(1)

    // 整份序列化中颜色只出现在样式定义里（每格仅一个 id 引用）
    const serialized = JSON.stringify({ cells, styles: sheet.stylePool.snapshot() })
    expect(serialized.match(/#FFAA00/g)).toHaveLength(1)
    expect(serialized.match(/"s":1/g)?.length).toBe(100)

    // 与单格版本相比，样式部分完全一致（体积不随 N 增长）
    const single = new Sheet()
    single.setCellStyle(parseRange('A1')!, { fill: { color: '#FFAA00' } })
    expect(JSON.stringify(single.stylePool.snapshot())).toBe(
      JSON.stringify(sheet.stylePool.snapshot())
    )
  })

  it('同样式重复设置 = 无实际变更，不入历史', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    const depth = sheet.history.undoSize
    sheet.setCellStyle(B2C3, { fill: { color: '#FF0000' } })
    expect(sheet.history.undoSize).toBe(depth)
  })

  it('setCellStyles 批量（按格不同 partial）= 单 undo 单元（外边框工具场景）', () => {
    const sheet = new Sheet()
    const range = parseRange('A1:C3')!
    const edge = { style: 'thin' as const, width: 1, color: '#000000' }
    const items = []
    for (const addr of iterateRange(range)) {
      const border: Record<string, typeof edge> = {}
      if (addr.row === range.start.row) border.top = edge
      if (addr.row === range.end.row) border.bottom = edge
      if (addr.col === range.start.col) border.left = edge
      if (addr.col === range.end.col) border.right = edge
      if (Object.keys(border).length > 0) items.push({ addr, partial: { border } })
    }
    sheet.setCellStyles(items)
    expect(sheet.history.undoSize).toBe(1)
    // 角格四边、边格三边、内部格无边
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.border).toMatchObject({ top: edge, left: edge })
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toBeUndefined()
    expect(sheet.getCellStyle({ row: 1, col: 0 })?.border?.left).toBeDefined()
    expect(sheet.getCellStyle({ row: 1, col: 0 })?.border?.right).toBeUndefined()

    sheet.undo()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
  })
})
