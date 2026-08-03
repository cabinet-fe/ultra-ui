import type { WriteOptions } from 'hucre'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseRange } from '../../address'
import { Sheet } from '../../sheet'
import { Workbook } from '../../workbook'
import { exportSheetCsv, exportWorkbookXlsx, rangeToHucre, styleToHucre } from '../export'

/**
 * 导出映射测试：模型 → hucre WriteOptions 结构（writeXlsx 参数捕获）。
 * round-trip 行为验证见 io-roundtrip.test.ts（真实 hucre）。
 */

const xlsxMock = vi.hoisted(() => ({ writeXlsx: vi.fn() }))
vi.mock('hucre/xlsx', () => ({ writeXlsx: xlsxMock.writeXlsx }))

/** 最近一次 writeXlsx 调用参数 */
let lastOptions: WriteOptions | undefined

beforeEach(() => {
  xlsxMock.writeXlsx.mockReset()
  xlsxMock.writeXlsx.mockImplementation((options: WriteOptions) => {
    lastOptions = options
    return Promise.resolve(new Uint8Array([0x50, 0x4b])) // PK 前缀
  })
})

describe('styleToHucre / rangeToHucre（样式与合并映射）', () => {
  it('fill → solid pattern + fgColor（去掉 #）；border → 四边 { style, color }（无宽度字段）', () => {
    expect(
      styleToHucre({
        fill: { color: '#FF0000' },
        border: {
          top: { style: 'thin', width: 1, color: '#000000' },
          left: { style: 'dashed', width: 1, color: '#00FF00' }
        }
      })
    ).toEqual({
      fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'dashed', color: { rgb: '00FF00' } }
      }
    })
  })

  it('无样式字段 → 空对象；mergeRange 0-based 闭区间映射', () => {
    expect(styleToHucre({})).toEqual({})
    expect(rangeToHucre(parseRange('B2:D4')!)).toEqual({
      startRow: 1,
      startCol: 1,
      endRow: 3,
      endCol: 3
    })
  })
})

describe('exportWorkbookXlsx 映射（hucre 输入结构）', () => {
  it('多 sheet：值（各 CellType）/ 公式 / 合并 / 样式 / 冻结 / 行高 / 活动表', async () => {
    const workbook = new Workbook()
    const s1 = workbook.activeSheet
    s1.setCellValue({ row: 0, col: 0 }, 42)
    s1.setCellValue({ row: 0, col: 1 }, 'hello')
    s1.setCellValue({ row: 0, col: 2 }, true)
    s1.setCellFormula({ row: 0, col: 3 }, '=A1*2')
    s1.setCell({ row: 0, col: 4 }, { v: '#DIV/0!', t: 'e' })
    s1.setCell({ row: 0, col: 5 }, { v: 45000, t: 'd' })
    s1.setCellStyle(parseRange('A1')!, { fill: { color: '#FF0000' } })
    s1.setCellStyle(parseRange('A1')!, {
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })
    s1.setCellValue({ row: 1, col: 0 }, 'merged')
    s1.mergeCells(parseRange('A2:B3')!)
    s1.setFrozen(1, 2)
    s1.setRowHeight(1, 30)
    s1.selectCell({ row: 2, col: 2 })

    const s2 = workbook.addSheet('S2')
    s2.setCellValue({ row: 0, col: 0 }, 'x')
    workbook.activateSheet('S2')

    await exportWorkbookXlsx(workbook)

    expect(xlsxMock.writeXlsx).toHaveBeenCalledTimes(1)
    const options = lastOptions!
    expect(options.sheets).toHaveLength(2)
    expect(options.activeSheet).toBe(1)

    // ── Sheet1（'Sheet1'）
    const sheet = options.sheets[0]!
    expect(sheet.name).toBe('Sheet1')
    // 值：数字 / 字符串 / 布尔（公式格计算值 84 进 rows；错误格 / 日期格 rows 置 null，值由 cells 覆盖）
    expect(sheet.rows![0]).toMatchObject([42, 'hello', true, 84, null, null])
    // 公式：f 不带 '='，formulaResult = 计算缓存
    expect(sheet.cells?.get('0,3')).toMatchObject({ formula: 'A1*2', formulaResult: 84 })
    // 错误格：error 类型值
    expect(sheet.cells?.get('0,4')).toMatchObject({ value: '#DIV/0!', type: 'error' })
    // 日期：数字 + 日期 numFmt
    const dateCell = sheet.cells?.get('0,5')
    expect(dateCell).toMatchObject({ value: 45000, type: 'number' })
    expect(dateCell?.style?.numFmt).toBe('yyyy-mm-dd')
    // 样式：fill + border（A1）
    expect(sheet.cells?.get('0,0')?.style).toMatchObject({
      fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } },
      border: { top: { style: 'thin', color: { rgb: '000000' } } }
    })
    // 合并：0-based 闭区间
    expect(sheet.merges).toEqual([{ startRow: 1, startCol: 0, endRow: 2, endCol: 1 }])
    // 冻结
    expect(sheet.freezePane).toEqual({ rows: 1, columns: 2 })
    // 行高：px → points（30 * 0.75 = 22.5）
    expect(sheet.rowDefs?.get(1)).toEqual({ height: 22.5 })

    // ── Sheet2
    expect(options.sheets[1]!.name).toBe('S2')
    expect(options.sheets[1]!.rows![0]).toMatchObject(['x'])
  })

  it('纯样式格（无值）也导出（cells 覆盖仅含 style，值保留 rows 语义）', async () => {
    const workbook = new Workbook()
    const sheet = workbook.activeSheet
    sheet.setCellStyle(parseRange('C3')!, { fill: { color: '#00FF00' } })
    await exportWorkbookXlsx(workbook)
    const options = lastOptions!
    // C3 在 rows 中为 null（无值），cells 提供 style
    expect(options.sheets[0]!.rows![2]![2]).toBeNull()
    expect(options.sheets[0]!.rows![2]![0]).toBeUndefined()
    expect(options.sheets[0]!.cells?.get('2,2')?.style?.fill).toEqual({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { rgb: '00FF00' }
    })
  })
})

describe('exportSheetCsv', () => {
  it('活动表 A1..最后有值格：数字/字符串/布尔直写，公式格导计算值，合并覆盖格为空，带 BOM', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')
    sheet.setCellValue({ row: 0, col: 2 }, true)
    sheet.setCellValue({ row: 1, col: 0 }, 'anchor')
    sheet.mergeCells(parseRange('A2:B2')!)
    sheet.setCellValue({ row: 9, col: 0 }, 'tail') // 裁剪空行：只到 row 9

    const csv = exportSheetCsv(sheet)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const body = csv.slice(1)
    // 公式格导计算值 2；合并覆盖格 B2 为空（同 Excel）；尾部裁剪到最后一个有值行（row 9）
    // hucre writeCsv：行间 \r\n、最后一行无
    expect(body).toBe('1,2,true\r\nanchor,,\r\n,,\r\n,,\r\n,,\r\n,,\r\n,,\r\n,,\r\n,,\r\ntail,,')
  })

  it('空表导出仅 BOM', () => {
    expect(exportSheetCsv(new Sheet())).toBe('\uFEFF')
  })
})
