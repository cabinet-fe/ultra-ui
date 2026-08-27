import type { Workbook as HucreWorkbook } from 'hucre'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Sheet } from '../../sheet'
import { Workbook } from '../../workbook'
import {
  dateToSerial1900,
  hucreStyleToModel,
  importCsv,
  importXlsx,
  replaceWorkbookWithSnapshots
} from '../import'

/**
 * 导入映射测试：hucre 读取结果（mock）→ 模型正确性。
 * 真实 XLSX 字节的 round-trip 见 io-roundtrip.test.ts。
 */

const xlsxMock = vi.hoisted(() => ({ readXlsx: vi.fn() }))
const csvMock = vi.hoisted(() => ({ parseCsv: vi.fn() }))
vi.mock('hucre/xlsx', () => ({ readXlsx: xlsxMock.readXlsx }))
vi.mock('hucre/csv', () => ({ parseCsv: csvMock.parseCsv }))

beforeEach(() => {
  xlsxMock.readXlsx.mockReset()
  csvMock.parseCsv.mockReset()
})

/** 1×1 红 PNG（最小合法字节） */
const PNG_1X1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
])

/** 构造 hucre 形态的 Workbook（值 / 公式 / 样式 / 合并 / 冻结 / 行高 / 主题色） */
function hucreWorkbook(): HucreWorkbook {
  return {
    sheets: [
      {
        name: '数据表',
        rows: [],
        cells: new Map([
          // 普通格带样式（两格同样式 → 池中一份，见「样式池去重」断言）
          [
            '0,0',
            {
              value: 1,
              type: 'number',
              style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } } }
            }
          ],
          // 合并区域外的同样式格（纯样式格：值 null 仅样式）→ intern 去重
          [
            '1,2',
            {
              value: null,
              type: 'empty',
              style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } } }
            }
          ],
          // 公式格（缓存 84 会被本地引擎重算覆盖为 2）
          ['0,2', { value: 84, type: 'number', formula: 'A1*2', formulaResult: 84 }],
          // theme 色边框（themeColors[1] = #FF0000）
          [
            '0,1',
            {
              value: 'x',
              type: 'string',
              style: { border: { top: { style: 'thin', color: { theme: 1 } } } }
            }
          ]
        ]),
        merges: [{ startRow: 0, startCol: 1, endRow: 1, endCol: 1 }],
        freezePane: { rows: 1, columns: 1 },
        rowDefs: new Map([[0, { height: 21 }]])
      },
      { name: 'Sheet2', rows: [], cells: new Map([['0,0', { value: 'b', type: 'string' }]]) }
    ],
    activeSheet: 1,
    themeColors: ['#FFFFFF', '#FF0000']
  }
}

describe('hucreStyleToModel / dateToSerial1900', () => {
  it('fill（solid fgColor / 渐变首色）与 border（线型收敛、theme 色解析、缺省黑）', () => {
    expect(
      hucreStyleToModel({ fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } } })
    ).toEqual({ fill: { color: '#FF0000' } })
    // xlsx 原生 8 位 ARGB 去掉前导 alpha 归一为 '#RRGGBB'
    expect(
      hucreStyleToModel({
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFF0000' } }
      })
    ).toEqual({ fill: { color: '#FF0000' } })
    // 条纹 pattern 取 fgColor；none/gray125 无视觉 → 忽略
    expect(
      hucreStyleToModel({
        fill: { type: 'pattern', pattern: 'darkDown', fgColor: { rgb: '00FF00' } }
      })
    ).toEqual({ fill: { color: '#00FF00' } })
    expect(
      hucreStyleToModel({ fill: { type: 'pattern', pattern: 'none', fgColor: { rgb: '000000' } } })
    ).toBeUndefined()
    // 渐变取首色
    expect(
      hucreStyleToModel({
        fill: {
          type: 'gradient',
          stops: [
            { position: 0, color: { rgb: '112233' } },
            { position: 1, color: { rgb: 'FFFFFF' } }
          ]
        }
      })
    ).toEqual({ fill: { color: '#112233' } })
    // border：theme 色经调色板解析；无颜色缺省黑；线型收敛
    expect(
      hucreStyleToModel(
        {
          border: {
            top: { style: 'thin', color: { theme: 1 } },
            bottom: { style: 'double', color: { rgb: '0000FF' } },
            left: { style: 'hair' }
          }
        },
        ['#FFFFFF', '#FF0000']
      )
    ).toEqual({
      border: {
        top: { style: 'thin', width: 1, color: '#FF0000' },
        bottom: { style: 'medium', width: 2, color: '#0000FF' },
        left: { style: 'thin', width: 1, color: '#000000' }
      }
    })
  })

  it('12 槽位标准主题色映射与 tint 亮度调整', () => {
    const palette = [
      '000000', // slot 0: dk1
      'FFFFFF', // slot 1: lt1
      '44546A', // slot 2: dk2
      'E7E6E6', // slot 3: lt2
      '4874CB', // slot 4: accent1
      'EE822F', // slot 5: accent2
      'F2BA02', // slot 6: accent3
      '75BD42', // slot 7: accent4
      '30C0B4', // slot 8: accent5
      'E54C5E', // slot 9: accent6
      '0026E5', // slot 10: hlink
      '7E1FAD' // slot 11: folHlink
    ]
    // theme 0 (lt1) → slot 1 (FFFFFF)
    expect(hucreStyleToModel({ font: { color: { theme: 0 } } }, palette)).toEqual({
      font: { color: '#FFFFFF' }
    })
    // theme 1 (dk1) → slot 0 (000000)
    expect(hucreStyleToModel({ font: { color: { theme: 1 } } }, palette)).toEqual({
      font: { color: '#000000' }
    })
    // theme 2 (lt2) → slot 3 (E7E6E6)
    expect(hucreStyleToModel({ font: { color: { theme: 2 } } }, palette)).toEqual({
      font: { color: '#E7E6E6' }
    })
    // theme 3 (dk2) → slot 2 (44546A)
    expect(hucreStyleToModel({ font: { color: { theme: 3 } } }, palette)).toEqual({
      font: { color: '#44546A' }
    })
    // theme 9 (accent6) → slot 9 (E54C5E)
    expect(hucreStyleToModel({ font: { color: { theme: 9 } } }, palette)).toEqual({
      font: { color: '#E54C5E' }
    })
    // tint 调整：正数变亮，负数变暗
    expect(hucreStyleToModel({ font: { color: { theme: 1, tint: 0.5 } } }, palette)).toEqual({
      font: { color: '#808080' }
    })
  })

  it('font / alignment 映射（underline 非 false、vertical center↔middle、wrapText）', () => {
    expect(
      hucreStyleToModel({
        font: {
          color: { rgb: 'FF0000' },
          bold: true,
          italic: true,
          underline: 'single',
          strikethrough: true,
          size: 14,
          name: 'Arial' // 本期不取
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
          shrinkToFit: true // 本期不取
        }
      })
    ).toEqual({
      font: {
        color: '#FF0000',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        size: 14
      },
      align: { horizontal: 'center', vertical: 'middle', wrap: true }
    })
    // general / justify 等非左中右 → 不设置；vertical justify → 不设置
    expect(
      hucreStyleToModel({
        alignment: { horizontal: 'general', vertical: 'justify', wrapText: false }
      })
    ).toBeUndefined()
  })

  it('dateToSerial1900：Date（UTC）→ 1900 系统序列数（含伪闰日修正）', () => {
    expect(dateToSerial1900(new Date('1900-01-01T00:00:00Z'))).toBe(1)
    expect(dateToSerial1900(new Date('1900-02-28T00:00:00Z'))).toBe(59)
    expect(dateToSerial1900(new Date('1900-03-01T00:00:00Z'))).toBe(61)
    expect(dateToSerial1900(new Date('2021-01-01T00:00:00Z'))).toBe(44197)
  })
})

describe('importXlsx 映射（hucre 读取结果 → 模型）', () => {
  it('建表 / 值 / 公式（本地重算）/ 合并 / 样式池去重 / theme 色 / 冻结 / 行高 / 活动表', async () => {
    xlsxMock.readXlsx.mockResolvedValue(hucreWorkbook())
    const workbook = await importXlsx(new Uint8Array())

    // 多 sheet + 名称 + 活动表
    expect(workbook.sheetCount).toBe(2)
    expect(workbook.getSheets()[0]!.name).toBe('数据表')
    expect(workbook.getSheets()[1]!.name).toBe('Sheet2')
    expect(workbook.activeSheet.name).toBe('Sheet2')
    // hucre 不解析 OOXML <selection> → 导入后各表默认 A1
    expect(workbook.activeSheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    expect(workbook.getSheets()[0]!.getSelection().activeCell).toEqual({ row: 0, col: 0 })

    const s1 = workbook.getSheet('数据表')!
    // 值
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 1, t: 'n' })
    expect(s1.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'x', t: 's' })
    // 公式：原文 + 本地引擎计算缓存（Excel 缓存 84 被重算为 2）
    expect(s1.getCellData({ row: 0, col: 2 })).toMatchObject({ f: 'A1*2', v: 2, t: 'n' })
    // 合并（覆盖格 B2 被跳过写入）
    expect(s1.getCellInfo({ row: 1, col: 1 }).kind).toBe('merged-covered')
    expect(s1.getCellData({ row: 1, col: 1 })).toBeUndefined()
    // 样式池去重：两格同样式 → 只 intern 一份（同一 id）
    expect(s1.stylePool.size).toBe(2) // fill 红 + theme 边框
    expect(s1.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#FF0000' } })
    expect(s1.getCellData({ row: 0, col: 0 })!.s).toBe(s1.getCellData({ row: 1, col: 2 })!.s)
    expect(s1.getCellStyle({ row: 0, col: 1 })).toEqual({
      border: { top: { style: 'thin', width: 1, color: '#FF0000' } }
    })
    // 冻结 / 行高（21pt → 28px）
    expect(s1.frozen).toEqual({ rows: 1, cols: 1 })
    expect(s1.getRowHeight(0)).toBe(28)

    // Sheet2
    expect(workbook.getSheet('Sheet2')!.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'b' })
  })

  it('浮动图 images → 模型；cellImages 跳过；纳入同事务 undo', async () => {
    xlsxMock.readXlsx.mockResolvedValue({
      sheets: [
        {
          name: '图',
          rows: [],
          cells: new Map([['0,0', { value: 'ok', type: 'string' }]]),
          images: [
            {
              data: PNG_1X1,
              type: 'png',
              anchor: { from: { row: 1, col: 2 }, to: { row: 5, col: 4 } },
              width: 160,
              height: 90,
              altText: 'chart',
              title: 'Q1'
            }
          ]
        }
      ],
      activeSheet: 0,
      // WPS 内嵌图在工作簿级；本期跳过（applyHucreSheet 不读）
      cellImages: [{ id: 'ID_xxx', data: PNG_1X1, type: 'png' }]
    })
    const workbook = await importXlsx(new Uint8Array())
    const sheet = workbook.activeSheet
    const images = sheet.getImages()
    expect(images).toHaveLength(1)
    expect(images[0]!.type).toBe('png')
    expect(images[0]!.anchor).toEqual({ from: { row: 1, col: 2 }, to: { row: 5, col: 4 } })
    expect(images[0]!.width).toBe(160)
    expect(images[0]!.height).toBe(90)
    expect(images[0]!.altText).toBe('chart')
    expect(images[0]!.title).toBe('Q1')
    expect([...images[0]!.data]).toEqual([...PNG_1X1])
    // 锚点计入渲染尺寸
    expect(sheet.rows).toBeGreaterThanOrEqual(6)
    expect(sheet.cols).toBeGreaterThanOrEqual(5)

    expect(sheet.history.undoSize).toBe(1)
    expect(sheet.undo()).toBe(true)
    expect(sheet.getImages()).toHaveLength(0)
    expect(sheet.store.size).toBe(0)
    expect(sheet.redo()).toBe(true)
    expect(sheet.getImages()).toHaveLength(1)
  })

  it('导入为单 undo 单元；undo 恢复导入前状态（空表）', async () => {
    xlsxMock.readXlsx.mockResolvedValue(hucreWorkbook())
    const workbook = await importXlsx(new Uint8Array())
    const s1 = workbook.getSheet('数据表')!

    // 清空 + 写入 + 合并 全部合并为一个事务
    expect(s1.history.undoSize).toBe(1)

    expect(s1.undo()).toBe(true)
    expect(s1.store.size).toBe(0)
    expect(s1.merges.size).toBe(0)
    // 冻结与行高是模型状态，不进 undo（同 rowHeights 先例）
    expect(s1.frozen).toEqual({ rows: 1, cols: 1 })
    expect(s1.getRowHeight(0)).toBe(28)

    expect(s1.redo()).toBe(true)
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 1 })
    expect(s1.merges.size).toBe(1)
  })

  it('空 sheet / 无合并 / 无样式：无操作不入历史', async () => {
    xlsxMock.readXlsx.mockResolvedValue({ sheets: [{ name: 'Empty', rows: [] }] })
    const workbook = await importXlsx(new Uint8Array())
    const sheet = workbook.activeSheet
    expect(sheet.name).toBe('Empty')
    expect(sheet.history.undoSize).toBe(0)
    expect(sheet.canUndo).toBe(false)
  })

  it('宽表导入：sheet.rows / sheet.cols ≥ 源表几何（含空行宽行）', async () => {
    xlsxMock.readXlsx.mockResolvedValue({
      sheets: [
        {
          name: 'Wide',
          rows: [],
          cells: new Map([
            ['0,0', { value: 'a', type: 'string' }],
            ['2,14', { value: '尾', type: 'string' }]
          ])
        }
      ]
    })
    const workbook = await importXlsx(new Uint8Array())
    const sheet = workbook.activeSheet
    expect(sheet.rows).toBeGreaterThanOrEqual(3)
    expect(sheet.cols).toBeGreaterThanOrEqual(15)
    expect(sheet.getCellData({ row: 2, col: 14 })).toMatchObject({ v: '尾' })
  })

  it('多 sheet 导入样式隔离：Sheet2 的样式不会受到 Sheet1 的 StyleId 污染', async () => {
    const style1 = { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFF00' } } }
    const style2 = { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF0000' } } }
    xlsxMock.readXlsx.mockResolvedValue({
      sheets: [
        {
          name: 'S1',
          rows: [],
          cells: new Map([['0,0', { value: 'yellow', type: 'string', style: style1 }]])
        },
        {
          name: 'S2',
          rows: [],
          cells: new Map([['0,0', { value: 'red', type: 'string', style: style2 }]])
        }
      ]
    })
    const workbook = await importXlsx(new Uint8Array())
    const s1 = workbook.getSheet('S1')!
    const s2 = workbook.getSheet('S2')!

    const s1Cell = s1.getCellData({ row: 0, col: 0 })!
    const s2Cell = s2.getCellData({ row: 0, col: 0 })!
    expect(s1.stylePool.get(s1Cell.s!)).toEqual({ fill: { color: '#FFFF00' } })
    expect(s2.stylePool.get(s2Cell.s!)).toEqual({ fill: { color: '#FF0000' } })
  })

  it('远格写入且尺寸按有值范围收敛', async () => {
    xlsxMock.readXlsx.mockResolvedValue({
      sheets: [
        {
          name: 'Far',
          rows: [],
          cells: new Map([
            ['0,0', { value: 1, type: 'number' }],
            ['2,3', { value: 'far', type: 'string' }]
          ])
        }
      ],
      activeSheet: 0
    })
    const sheet = (await importXlsx(new Uint8Array())).activeSheet
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 1 })
    expect(sheet.getCellData({ row: 2, col: 3 })).toMatchObject({ v: 'far' })
    expect(sheet.rows).toBeLessThan(20)
    expect(sheet.cols).toBeLessThan(20)
  })

  it('16384 列默认列宽不撑开渲染列数', async () => {
    const columns = Array.from({ length: 16384 }, () => ({ width: 8.43 }))
    xlsxMock.readXlsx.mockResolvedValue({
      sheets: [
        {
          name: 'Cols',
          rows: [],
          cells: new Map([
            ['0,0', { value: 1, type: 'number' }],
            ['0,1', { value: 2, type: 'number' }]
          ]),
          columns
        }
      ],
      activeSheet: 0
    })
    const sheet = (await importXlsx(new Uint8Array())).activeSheet
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 2 })
    expect(sheet.cols).toBeLessThan(200)
    // 默认列宽不得外扩 KEEP_MARGIN 写进模型（否则切 sheet 会逐列 setColWidth 卡死）
    expect(sheet.getColWidths().size).toBeLessThanOrEqual(sheet.cols)
  })
})

describe('importCsv（写入既有活动表）', () => {
  it('数字 / 字符串 / 布尔写入；空串清除；空格跳过；单 undo 单元', () => {
    csvMock.parseCsv.mockReturnValue([
      [1, 'abc', true],
      ['', 'x', null]
    ])
    const sheet = new Sheet()
    sheet.setCellValue({ row: 1, col: 2 }, 'old') // 空格（null）不覆盖既有格

    importCsv('', sheet)

    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 1, t: 'n' })
    expect(sheet.getCellData({ row: 0, col: 1 })).toEqual({ v: 'abc', t: 's' })
    expect(sheet.getCellData({ row: 0, col: 2 })).toEqual({ v: true, t: 'b' })
    expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined() // '' → 清除
    expect(sheet.getCellData({ row: 1, col: 1 })).toEqual({ v: 'x', t: 's' })
    expect(sheet.getCellData({ row: 1, col: 2 })).toEqual({ v: 'old', t: 's' }) // null 跳过

    expect(sheet.history.undoSize).toBe(2) // setCellValue('old') 1 条 + importCsv 事务 1 条
    sheet.undo()
    // 事务撤销：导入内容全部还原；事务前的 'old' 不受影响
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
    expect(sheet.getCellData({ row: 1, col: 2 })).toEqual({ v: 'old', t: 's' })
  })

  it('宽 CSV：按解析行列扩张 sheet.rows / sheet.cols', () => {
    csvMock.parseCsv.mockReturnValue([Array.from({ length: 20 }, (_, i) => `c${i}`), ['only']])
    const sheet = new Sheet()
    importCsv('', sheet)
    expect(sheet.rows).toBeGreaterThanOrEqual(2)
    expect(sheet.cols).toBeGreaterThanOrEqual(20)
  })
})

describe('replaceWorkbookWithSnapshots', () => {
  it('replaceWorkbookWithSnapshots：选区对齐快照（导入默认 A1，不残留目标旧选区）', () => {
    const A1 = { row: 0, col: 0 }
    const C3 = { row: 2, col: 2 }

    const target = new Workbook()
    target.activeSheet.selectCell(C3)
    expect(target.activeSheet.getSelection().activeCell).toEqual(C3)

    const source = new Workbook()
    source.activeSheet.setCellValue(A1, 'imported')
    // importXlsx 路径下源表构造默认即为 A1；此处显式保证
    expect(source.activeSheet.getSelection().activeCell).toEqual(A1)
    const snapshots = source.getSheets().map((s) => ({ name: s.name, snapshot: s.snapshot() }))

    replaceWorkbookWithSnapshots(target, snapshots, source.activeSheetIndex)
    expect(target.activeSheet.getSelection()).toEqual({
      activeCell: A1,
      ranges: [{ start: A1, end: A1 }]
    })

    // 选区不进 undo：撤销内容后选区仍为导入后的 A1
    expect(target.activeSheet.undo()).toBe(true)
    expect(target.activeSheet.getSelection().activeCell).toEqual(A1)
  })

  it('replaceWorkbookWithSnapshots：快照数组直接替换（worker 链路入口）', () => {
    const target = new Workbook()
    target.activeSheet.setCellValue({ row: 0, col: 0 }, 'old1')
    target.addSheet('Old2')
    target.activeSheet.setFrozen(2, 1)

    const make = (): Workbook => {
      const wb = new Workbook()
      wb.activeSheet.setCellValue({ row: 0, col: 0 }, 'a1')
      wb.activeSheet.setFrozen(1, 0)
      wb.activeSheet.setRowHeight(4, 66)
      wb.addSheet('B').setCellValue({ row: 0, col: 0 }, 'b1')
      wb.addSheet('C').setCellValue({ row: 0, col: 0 }, 'c1')
      wb.activateSheet('C')
      return wb
    }
    const source = make()
    const snapshots = source.getSheets().map((s) => ({ name: s.name, snapshot: s.snapshot() }))

    replaceWorkbookWithSnapshots(target, snapshots, source.activeSheetIndex)

    expect(target.sheetCount).toBe(3)
    expect(target.getSheets().map((s) => s.name)).toEqual(['Sheet1', 'B', 'C'])
    expect(target.getSheet('Sheet1')!.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'a1' })
    expect(target.getSheet('B')!.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'b1' })
    expect(target.getSheet('C')!.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'c1' })
    expect(target.activeSheet.name).toBe('C')
    // 冻结 / 行高随快照写入（模型状态，不进 undo）；rowHeights 已在 SheetSnapshot 内
    expect(target.getSheet('Sheet1')!.frozen).toEqual({ rows: 1, cols: 0 })
    expect(target.getSheet('Sheet1')!.getRowHeight(4)).toBe(66)
    expect(target.getSheet('Old2')).toBeUndefined()

    // 每个 sheet 内容替换 = 单 undo 单元（第一个 sheet 的替换可 undo）
    expect(target.getSheet('Sheet1')!.undo()).toBe(true)
    expect(target.getSheet('Sheet1')!.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'old1' })
    // 选区 / 冻结 / 行高不进 undo（undo 内容后仍保留替换后状态）
    expect(target.getSheet('Sheet1')!.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    expect(target.getSheet('Sheet1')!.frozen).toEqual({ rows: 1, cols: 0 })
    expect(target.getSheet('Sheet1')!.getRowHeight(4)).toBe(66)
  })

  it('replaceWorkbookWithSnapshots：空快照数组保留单个空 sheet', () => {
    const target = new Workbook()
    target.activeSheet.setCellValue({ row: 0, col: 0 }, 'x')
    replaceWorkbookWithSnapshots(target, [], 0)
    expect(target.sheetCount).toBe(1)
    expect(target.getSheet('Sheet1')!.getCellData({ row: 0, col: 0 })).toBeUndefined()
  })

  it('合并单元格：聚合分散在边缘格上的边框（如底边记录在 endRow，右边记录在 endCol）', async () => {
    // 构造一个 3x3 合并区域 (A1:C3，即 0,0..2,2)
    // A1 (0,0): top/left 边框
    // C1 (0,2): right 边框
    // A3 (2,0): bottom 边框
    // B2 (1,1): 内部值与 fill
    const mockWb: HucreWorkbook = {
      sheets: [
        {
          name: 'MergeBorderTest',
          rows: [],
          cells: new Map([
            [
              '0,0',
              {
                value: null,
                style: {
                  border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } }
                  }
                }
              }
            ],
            [
              '0,2',
              {
                value: null,
                style: { border: { right: { style: 'thin', color: { rgb: '000000' } } } }
              }
            ],
            [
              '2,0',
              {
                value: null,
                style: { border: { bottom: { style: 'thick', color: { rgb: 'FF0000' } } } }
              }
            ],
            [
              '1,1',
              {
                value: 'MergedContent',
                type: 'string',
                style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: '00FF00' } } }
              }
            ]
          ]),
          merges: [{ startRow: 0, startCol: 0, endRow: 2, endCol: 2 }]
        }
      ],
      activeSheet: 0
    }
    xlsxMock.readXlsx.mockResolvedValue(mockWb)

    const wb = await importXlsx(new Uint8Array())
    const sheet = wb.activeSheet

    // 锚点格应该聚合了所有四边的边框、fill 与内部格的值
    const anchorData = sheet.getCellData({ row: 0, col: 0 })
    expect(anchorData?.v).toBe('MergedContent')

    const anchorStyle = sheet.getCellStyle({ row: 0, col: 0 })
    expect(anchorStyle?.fill).toEqual({ color: '#00FF00' })
    expect(anchorStyle?.border).toEqual({
      top: { style: 'thin', width: 1, color: '#000000' },
      left: { style: 'thin', width: 1, color: '#000000' },
      right: { style: 'thin', width: 1, color: '#000000' },
      bottom: { style: 'thick', width: 3, color: '#FF0000' }
    })

    // 覆盖格不应占用 store 存储
    expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 2 })).toBeUndefined()
    expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
  })
})
