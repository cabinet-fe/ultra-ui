import { describe, expect, it } from 'vitest'

import { CELL_READONLY_META_NAMESPACE } from '../cell-readonly'
import { Sheet } from '../sheet'

describe('Sheet 单元格只读：标记 / 查询 / 解除', () => {
  it('setCellReadonly 标记后 isCellReadonly 为 true；解除后恢复', () => {
    const sheet = new Sheet()
    const addr = { row: 1, col: 2 }

    expect(sheet.isCellReadonly(addr)).toBe(false)

    sheet.setCellReadonly(addr)
    expect(sheet.isCellReadonly(addr)).toBe(true)
    // 经 Cell Meta 存储（payload 恒为 true）
    expect(sheet.getCellMeta(addr, CELL_READONLY_META_NAMESPACE)).toBe(true)

    sheet.setCellReadonly(addr, false)
    expect(sheet.isCellReadonly(addr)).toBe(false)
    expect(sheet.getCellMeta(addr, CELL_READONLY_META_NAMESPACE)).toBeUndefined()
  })

  it('重复标记 / 解除空格无操作、不入历史', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }

    sheet.setCellReadonly(addr, false)
    expect(sheet.canUndo).toBe(false)

    sheet.setCellReadonly(addr)
    sheet.setCellReadonly(addr)
    expect(sheet.history.undoSize).toBe(1)
  })

  it('合并格：标记被覆盖格落在锚点上', () => {
    const sheet = new Sheet()
    sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })

    sheet.setCellReadonly({ row: 2, col: 2 })

    expect(sheet.isCellReadonly({ row: 1, col: 1 })).toBe(true)
    expect(sheet.isCellReadonly({ row: 2, col: 2 })).toBe(true)
    // 数据只存锚点：锚点外的被覆盖格无独立 meta
    expect(sheet.getCellMeta({ row: 2, col: 2 }, CELL_READONLY_META_NAMESPACE)).toBe(true)
  })

  it('不影响单元格数据：只读格照常读写模型值', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    sheet.setCellValue(addr, 'label')
    sheet.setCellReadonly(addr)

    // 模型层不设防：命令仍可写入（拦截在 grid 层）
    sheet.setCellValue(addr, 'changed')
    expect(sheet.getCellData(addr)).toMatchObject({ v: 'changed' })
    expect(sheet.isCellReadonly(addr)).toBe(true)
  })
})

describe('Sheet 单元格只读：undo / redo / 快照 / 结构平移', () => {
  it('undo 清除标记、redo 恢复', () => {
    const sheet = new Sheet()
    const addr = { row: 2, col: 3 }

    sheet.setCellReadonly(addr)
    expect(sheet.undo()).toBe(true)
    expect(sheet.isCellReadonly(addr)).toBe(false)
    expect(sheet.redo()).toBe(true)
    expect(sheet.isCellReadonly(addr)).toBe(true)
  })

  it('setRangeReadonly 批量标记合并为单 undo 单元，解除同理', () => {
    const sheet = new Sheet()
    const range = { start: { row: 0, col: 0 }, end: { row: 2, col: 3 } }

    sheet.setRangeReadonly(range)
    expect(sheet.isCellReadonly({ row: 0, col: 0 })).toBe(true)
    expect(sheet.isCellReadonly({ row: 2, col: 3 })).toBe(true)
    expect(sheet.history.undoSize).toBe(1)

    // 区域解除后留出可编辑格
    sheet.setCellReadonly({ row: 1, col: 1 }, false)
    expect(sheet.isCellReadonly({ row: 1, col: 1 })).toBe(false)
    expect(sheet.isCellReadonly({ row: 1, col: 2 })).toBe(true)

    expect(sheet.undo()).toBe(true) // 撤销解除
    expect(sheet.isCellReadonly({ row: 1, col: 1 })).toBe(true)
    expect(sheet.undo()).toBe(true) // 一次撤销整个区域标记
    expect(sheet.isCellReadonly({ row: 0, col: 0 })).toBe(false)
    expect(sheet.isCellReadonly({ row: 2, col: 3 })).toBe(false)
    expect(sheet.canUndo).toBe(false)
  })

  it('随快照序列化往返（restore 整表恢复）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'label')
    sheet.setCellReadonly({ row: 0, col: 0 })
    sheet.setRangeReadonly({ start: { row: 3, col: 1 }, end: { row: 4, col: 2 } })

    const restored = new Sheet()
    restored.restore(sheet.snapshot())

    expect(restored.isCellReadonly({ row: 0, col: 0 })).toBe(true)
    expect(restored.isCellReadonly({ row: 3, col: 1 })).toBe(true)
    expect(restored.isCellReadonly({ row: 4, col: 2 })).toBe(true)
    expect(restored.isCellReadonly({ row: 0, col: 1 })).toBe(false)
  })

  it('插入行列时随结构平移', () => {
    const sheet = new Sheet()
    sheet.setCellReadonly({ row: 2, col: 1 })

    sheet.insertRows(1, 1)
    expect(sheet.isCellReadonly({ row: 2, col: 1 })).toBe(false)
    expect(sheet.isCellReadonly({ row: 3, col: 1 })).toBe(true)

    sheet.insertCols(0, 1)
    expect(sheet.isCellReadonly({ row: 3, col: 1 })).toBe(false)
    expect(sheet.isCellReadonly({ row: 3, col: 2 })).toBe(true)
  })
})
