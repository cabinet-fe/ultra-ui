import { describe, expect, it } from 'vitest'

import { parseRange } from '../../address'
import { Sheet } from '../../sheet'
import { Workbook } from '../../workbook'
import { exportSheetCsv, exportWorkbookXlsx } from '../export'
import { importCsv, importXlsx } from '../import'

/**
 * round-trip 保真（真实 hucre 读写，非 mock）：
 * 导出 → 再导入 → 值 / 公式 / 合并 / 样式 / 冻结 / 行高抽样断言一致。
 */

/** 构造含公式 / 合并 / 样式 / 冻结 / 行高 / 日期 / 跨表公式的工作簿 */
function buildWorkbook(): Workbook {
  const workbook = new Workbook()
  const s1 = workbook.activeSheet
  s1.setCellValue({ row: 0, col: 0 }, 42)
  s1.setCellValue({ row: 0, col: 1 }, 'hello')
  s1.setCellValue({ row: 0, col: 2 }, true)
  s1.setCellFormula({ row: 0, col: 3 }, '=A1*2') // 84
  s1.setCellFormula({ row: 0, col: 4 }, '=SUM(A1:C1)') // 区域内文本/布尔忽略 → 42
  s1.setCell({ row: 1, col: 0 }, { v: 45000, t: 'd' }) // 日期序列
  s1.setCell({ row: 1, col: 1 }, { v: '#DIV/0!', t: 'e' }) // 错误格
  s1.setCellValue({ row: 2, col: 0 }, 'merged') // 合并锚点 A3
  s1.mergeCells(parseRange('A3:B4')!)
  s1.setCellStyle(parseRange('A1')!, {
    fill: { color: '#FF0000' },
    border: {
      top: { style: 'thin', width: 1, color: '#000000' },
      bottom: { style: 'dashed', width: 1, color: '#00FF00' }
    }
  })
  s1.setCellStyle(parseRange('B1')!, {
    fill: { color: '#FF0000' },
    border: {
      top: { style: 'thin', width: 1, color: '#000000' },
      bottom: { style: 'dashed', width: 1, color: '#00FF00' }
    }
  }) // 与 A1 完全相同 → 共享一份样式定义
  // 文本样式组合：红字 + 加粗斜体下划线删除线 + 字号 + 居中 + 换行
  s1.setCellValue({ row: 5, col: 0 }, 'styled')
  s1.setCellStyle(parseRange('A6')!, {
    font: {
      color: '#FF0000',
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      size: 16
    },
    align: { horizontal: 'center', vertical: 'middle', wrap: true }
  })
  s1.setFrozen(1, 2)
  s1.setRowHeight(1, 40)
  s1.setRowHeight(5, 24)

  const s2 = workbook.addSheet('S2')
  s2.setCellValue({ row: 0, col: 0 }, 10)
  s2.setCellFormula({ row: 0, col: 1 }, '=Sheet1!A1+1') // 跨表：43
  return workbook
}

describe('XLSX round-trip（导出 → 导入）', () => {
  it('值 / 公式 / 合并 / 样式 / 冻结 / 行高 / 日期 / 错误格 / 跨表公式一致', async () => {
    const source = buildWorkbook()
    const buffer = await exportWorkbookXlsx(source)
    expect(buffer).toBeInstanceOf(Uint8Array)
    expect(buffer.length).toBeGreaterThan(100)

    const imported = await importXlsx(buffer)
    expect(imported.sheetCount).toBe(2)
    // 源表名 'Sheet1'（buildWorkbook 未改名）→ 导入后同名
    const s1 = imported.getSheet('Sheet1')!
    const s2 = imported.getSheet('S2')!

    // 值
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 42, t: 'n' })
    expect(s1.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'hello', t: 's' })
    expect(s1.getCellData({ row: 0, col: 2 })).toMatchObject({ v: true, t: 'b' })
    // 公式：原文 + 本地引擎计算缓存
    expect(s1.getCellData({ row: 0, col: 3 })).toMatchObject({ f: 'A1*2', v: 84 })
    expect(s1.getCellData({ row: 0, col: 4 })).toMatchObject({ f: 'SUM(A1:C1)', v: 42 })
    // 日期（serial 45000 round-trip）+ 错误格
    expect(s1.getCellData({ row: 1, col: 0 })).toMatchObject({ v: 45000, t: 'd' })
    expect(s1.getCellData({ row: 1, col: 1 })).toMatchObject({ v: '#DIV/0!', t: 'e' })
    // 合并（A3:B4 → 覆盖格 B4 显示锚点值）
    expect(s1.getCellInfo({ row: 3, col: 1 }).kind).toBe('merged-covered')
    expect(s1.getDisplayValue({ row: 3, col: 1 })).toBe('merged')
    // 样式（fill + 四边 border；同样式共享一份定义）
    expect(s1.getCellStyle({ row: 0, col: 0 })).toEqual({
      fill: { color: '#FF0000' },
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        bottom: { style: 'dashed', width: 1, color: '#00FF00' }
      }
    })
    expect(s1.getCellStyle({ row: 0, col: 1 })).toEqual(s1.getCellStyle({ row: 0, col: 0 }))
    expect(s1.getCellData({ row: 0, col: 0 })!.s).toBe(s1.getCellData({ row: 0, col: 1 })!.s)
    // 文本样式 round-trip（红字/B/I/U/S/字号/对齐/换行）
    expect(s1.getCellData({ row: 5, col: 0 })).toMatchObject({ v: 'styled', t: 's' })
    expect(s1.getCellStyle({ row: 5, col: 0 })).toEqual({
      font: {
        color: '#FF0000',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        size: 16
      },
      align: { horizontal: 'center', vertical: 'middle', wrap: true }
    })
    // 冻结 / 行高（40px → 30pt → 40px；24px → 18pt → 24px）
    expect(s1.frozen).toEqual({ rows: 1, cols: 2 })
    expect(s1.getRowHeight(1)).toBe(40)
    expect(s1.getRowHeight(5)).toBe(24)
    // 跨表公式
    expect(s2.getCellData({ row: 0, col: 1 })).toMatchObject({ f: 'Sheet1!A1+1', v: 43 })
    // 触发跨表重算仍正确
    s1.setCellValue({ row: 0, col: 0 }, 100)
    expect(s2.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 101 })
  })

  it('导入为单 undo 单元：undo 恢复导入前状态（空表）', async () => {
    const buffer = await exportWorkbookXlsx(buildWorkbook())
    const imported = await importXlsx(buffer)
    const s1 = imported.getSheet('Sheet1')!

    expect(s1.history.undoSize).toBe(1)
    expect(s1.undo()).toBe(true)
    expect(s1.store.size).toBe(0)
    expect(s1.merges.size).toBe(0)

    expect(s1.redo()).toBe(true)
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 42 })
    expect(s1.merges.size).toBe(1)
  })
})

describe('CSV round-trip（导出 → 导入）', () => {
  it('值 / 公式计算值 / 合并锚点显示 / 类型推断', () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellValue({ row: 0, col: 1 }, 'hello')
    sheet.setCellFormula({ row: 0, col: 2 }, '=A1*3') // 3
    sheet.setCellValue({ row: 1, col: 0 }, 'anchor')
    sheet.mergeCells(parseRange('A2:B2')!)

    const csv = exportSheetCsv(sheet)
    // hucre writeCsv：行间 \r\n、最后一行无
    expect(csv).toBe('\uFEFF1,hello,3\r\nanchor,,')

    // 导入到新表（覆盖写入 A1 起区域）
    const target = new Sheet()
    importCsv(csv, target)
    expect(target.getCellData({ row: 0, col: 0 })).toEqual({ v: 1, t: 'n' })
    expect(target.getCellData({ row: 0, col: 1 })).toEqual({ v: 'hello', t: 's' })
    // CSV 无公式语义：计算值 3 以数字文本回写（typeInference 转数字）
    expect(target.getCellData({ row: 0, col: 2 })).toEqual({ v: 3, t: 'n' })
    expect(target.getCellData({ row: 1, col: 0 })).toEqual({ v: 'anchor', t: 's' })
  })
})
