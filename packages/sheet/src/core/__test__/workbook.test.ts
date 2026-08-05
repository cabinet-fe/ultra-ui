import { describe, expect, it, vi } from 'vitest'

import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

/** 0-based 常用地址 */
const A1 = { row: 0, col: 0 }
const B1 = { row: 0, col: 1 }
const B2 = { row: 1, col: 1 }
const D1 = { row: 0, col: 3 }

describe('Workbook.renameSheet', () => {
  it('空名（含纯空白）拒绝；不存在的表拒绝', () => {
    const wb = new Workbook()
    wb.addSheet('Sheet2')
    expect(wb.renameSheet('Sheet1', '')).toBe(false)
    expect(wb.renameSheet('Sheet1', '   ')).toBe(false)
    expect(wb.renameSheet('Nope', 'X')).toBe(false)
    expect(wb.activeSheet.name).toBe('Sheet1')
  })

  it('与现有表重名拒绝（不区分大小写，含自身大小写变体）', () => {
    const wb = new Workbook()
    wb.addSheet('Sheet2')
    expect(wb.renameSheet('Sheet1', 'Sheet2')).toBe(false)
    expect(wb.renameSheet('Sheet1', 'SHEET2')).toBe(false)
    expect(wb.renameSheet('Sheet1', 'sheet2')).toBe(false)
    // 自身大小写变体（Excel 语义：sheet 名不区分大小写）→ 拒绝
    expect(wb.renameSheet('Sheet1', 'sheet1')).toBe(false)
    expect(wb.renameSheet('Sheet1', 'SHEET1')).toBe(false)
    expect(wb.activeSheet.name).toBe('Sheet1')
  })

  it('改名成功：Sheet.name / getSheet / formulaGraph 注册表全部切新名', () => {
    const wb = new Workbook()
    const sheet = wb.activeSheet
    expect(wb.renameSheet('Sheet1', ' 数据表 ')).toBe(true) // trim 后生效
    expect(sheet.name).toBe('数据表')
    expect(wb.getSheet('数据表')).toBe(sheet)
    expect(wb.getSheet('Sheet1')).toBeUndefined()
    expect(wb.formulaGraph.getSheet('数据表')).toBe(sheet)
    expect(wb.formulaGraph.getSheet('Sheet1')).toBeUndefined()
  })

  it('改名后跨表引用值不变（引用跟随新名），触发重算仍正确', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('Sheet2')
    s2.setCellValue(A1, 10)
    s1.setCellFormula(B1, '=Sheet2!A1*2')
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })

    expect(wb.renameSheet('Sheet2', 'Data')).toBe(true)
    // 缓存值不因改名失效
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })
    // 被引用表值变更 → 重算仍正确（依赖索引已跟随新名）
    s2.setCellValue(A1, 7)
    expect(s1.getCellData(B1)).toMatchObject({ v: 14 })
  })

  it('改名后区域引用 / 本表引用 / 显式自名引用全部跟随', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('S2')
    s2.setCellValue(A1, 1)
    s2.setCellValue({ row: 1, col: 1 }, 2)
    s1.setCellFormula(A1, "=SUM('S2'!A1:B2)")
    // 本表引用（无显式表名）
    s2.setCellFormula(B1, '=A1*10')
    // 显式引用自身旧名（Excel 语义：跟随改名）
    s2.setCellFormula(B2, "='S2'!A1+100")
    // A1:B2 区域内：A1=1 + B1(=A1*10→10) + A2(空) + B2(='S2'!A1+100→101) = 112
    expect(s1.getCellData(A1)).toMatchObject({ v: 112 })
    expect(s2.getCellData(B1)).toMatchObject({ v: 10 })
    expect(s2.getCellData(B2)).toMatchObject({ v: 101 })

    expect(wb.renameSheet('S2', 'Renamed')).toBe(true)
    expect(s1.getCellData(A1)).toMatchObject({ v: 112 })
    expect(s2.getCellData(B1)).toMatchObject({ v: 10 })
    expect(s2.getCellData(B2)).toMatchObject({ v: 101 })
    // 触发重算验证索引完好：A1=5 → 5 + 50 + 0 + 105 = 160
    s2.setCellValue(A1, 5)
    expect(s1.getCellData(A1)).toMatchObject({ v: 160 })
    expect(s2.getCellData(B1)).toMatchObject({ v: 50 })
    expect(s2.getCellData(B2)).toMatchObject({ v: 105 })
  })

  it('undo/redo 回放不破坏改名后的引用', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('Sheet2')
    s2.setCellValue(A1, 10)
    s1.setCellFormula(B1, '=Sheet2!A1*2')
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })

    wb.renameSheet('Sheet2', 'Data')
    // 改名后的新历史条目：undo/redo 回放（不重算）经 syncCell 维持图状态
    s2.setCellValue(A1, 5)
    expect(s1.getCellData(B1)).toMatchObject({ v: 10 })
    expect(s2.undo()).toBe(true)
    expect(s2.getCellData(A1)).toMatchObject({ v: 10 })
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })
    expect(s2.redo()).toBe(true)
    expect(s2.getCellData(A1)).toMatchObject({ v: 5 })
    expect(s1.getCellData(B1)).toMatchObject({ v: 10 })
  })

  it('改名后删除新名表 → 引用方 #REF!（删除联动对新名索引生效）', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    wb.addSheet('Sheet2')
    s1.setCellFormula(B1, '=Sheet2!A1+D1')
    s1.setCellValue(D1, 1)
    expect(s1.getCellData(B1)).toMatchObject({ v: 1 })

    wb.renameSheet('Sheet2', 'Data')
    wb.removeSheet('Data')
    expect(s1.getCellData(B1)).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it('连续两次改名（A→B→C）：引用最初旧名的公式仍跟随（别名链拍平）', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('Sheet2')
    s2.setCellValue(A1, 10)
    s1.setCellFormula(B1, '=Sheet2!A1*2')
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })

    expect(wb.renameSheet('Sheet2', 'Mid')).toBe(true)
    expect(wb.renameSheet('Mid', 'Final')).toBe(true)
    // 触发重算：引用 Sheet2 的公式须解析到 Final
    s2.setCellValue(A1, 6)
    expect(s1.getCellData(B1)).toMatchObject({ v: 12 })
  })

  it('改名回改（A→B→A）：引用旧名的公式解析到真实表（残留别名不覆盖真实名）', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('Sheet2')
    s2.setCellValue(A1, 10)
    s1.setCellFormula(B1, '=Sheet2!A1*2')
    expect(s1.getCellData(B1)).toMatchObject({ v: 20 })

    expect(wb.renameSheet('Sheet2', 'Renamed')).toBe(true)
    expect(wb.renameSheet('Renamed', 'Sheet2')).toBe(true)
    s2.setCellValue(A1, 8)
    expect(s1.getCellData(B1)).toMatchObject({ v: 16 })
  })

  it('发 sheet-rename 事件（含 oldName/newName）', () => {
    const wb = new Workbook()
    const s2 = wb.addSheet('Sheet2')
    const handler = vi.fn()
    wb.on('sheet-rename', handler)
    expect(wb.renameSheet('Sheet2', 'Data')).toBe(true)
    expect(handler).toHaveBeenCalledWith({ sheet: s2, oldName: 'Sheet2', newName: 'Data' })
    // 拒绝时不发事件
    expect(wb.renameSheet('Data', 'Sheet1')).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('Workbook.removeSheet 健壮性', () => {
  it('最后一个 sheet 删除返回 false', () => {
    const wb = new Workbook()
    expect(wb.removeSheet('Sheet1')).toBe(false)
    expect(wb.sheetCount).toBe(1)
  })

  it('引用方公式立即变 #REF!（单格引用）', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet('Sheet2')
    s2.setCellValue(A1, 10)
    s1.setCellFormula(B1, '=Sheet2!A1+D1')
    s1.setCellValue(D1, 1)
    expect(s1.getCellData(B1)).toMatchObject({ v: 11 })

    expect(wb.removeSheet('Sheet2')).toBe(true)
    expect(s1.getCellData(B1)).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it('区域引用方变 #REF!', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    wb.addSheet('Sheet2')
    s1.setCellFormula(A1, "=SUM('Sheet2'!A1:B2)")
    expect(s1.getCellData(A1)).toMatchObject({ v: 0 })
    wb.removeSheet('Sheet2')
    expect(s1.getCellData(A1)).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it('传递依赖者一并重算为 #REF!', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    wb.addSheet('Sheet2')
    s1.setCellFormula(B1, '=Sheet2!A1*2')
    s1.setCellFormula(B2, '=B1+1')
    expect(s1.getCellData(B1)).toMatchObject({ v: 0 })
    expect(s1.getCellData(B2)).toMatchObject({ v: 1 })

    wb.removeSheet('Sheet2')
    expect(s1.getCellData(B1)).toMatchObject({ v: '#REF!', t: 'e' })
    expect(s1.getCellData(B2)).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it('被删表自身的公式节点被清理（nodeCount 归零）', () => {
    const wb = new Workbook()
    const s2 = wb.addSheet('Sheet2')
    s2.setCellFormula(A1, '=1+1')
    s2.setCellFormula(B1, '=A1*2')
    expect(wb.formulaGraph.nodeCount).toBe(2)
    wb.removeSheet('Sheet2')
    expect(wb.formulaGraph.nodeCount).toBe(0)
  })

  it('删除激活项后相邻激活正确', () => {
    const wb = new Workbook()
    const s2 = wb.addSheet('Sheet2')
    const s3 = wb.addSheet('Sheet3')
    // 激活最后一项，删除它 → 激活前一相邻项
    wb.activateSheet('Sheet3')
    expect(wb.removeSheet('Sheet3')).toBe(true)
    expect(wb.activeSheet).toBe(s2)
    expect(wb.activeSheetIndex).toBe(1)
    // 删除激活项之前的项：激活项保持（index 前移）
    expect(wb.removeSheet('Sheet1')).toBe(true)
    expect(wb.activeSheet).toBe(s2)
    expect(wb.activeSheetIndex).toBe(0)
    // 最后一个 sheet 禁删：删除 Sheet2（此时唯一剩余）→ false，激活不变
    expect(wb.removeSheet('Sheet2')).toBe(false)
    expect(wb.activeSheet).toBe(s2)
    expect(wb.activeSheetIndex).toBe(0)
  })

  it('删除中间激活项 → 激活后一相邻', () => {
    const wb = new Workbook()
    wb.addSheet('Sheet2')
    wb.addSheet('Sheet3')
    wb.activateSheet('Sheet2')
    expect(wb.removeSheet('Sheet2')).toBe(true)
    expect(wb.activeSheet.name).toBe('Sheet3')
    expect(wb.activeSheetIndex).toBe(1)
  })

  it('删除非激活项：激活项保持（activeIndex 前移指向原激活项）', () => {
    const wb = new Workbook()
    wb.addSheet('Sheet2')
    wb.addSheet('Sheet3')
    wb.activateSheet('Sheet3')
    const handler = vi.fn()
    wb.on('active-sheet-change', handler)
    expect(wb.removeSheet('Sheet1')).toBe(true)
    expect(wb.activeSheet.name).toBe('Sheet3')
    // index 0 < activeIndex 2 → 前移为 1，仍指向 Sheet3
    expect(wb.activeSheetIndex).toBe(1)
    // 删除非激活项：事件携带修正后的激活项（既有行为：总是发 active-sheet-change）
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ sheet: wb.activeSheet, index: 1 })
  })
})

describe('Sheet.name 受控', () => {
  it('name 只读：直接赋值被拒（严格模式 getter-only 抛 TypeError）', () => {
    const sheet = new Sheet('A')
    expect(() => {
      ;(sheet as { name: string }).name = 'B'
    }).toThrow()
    expect(sheet.name).toBe('A')
  })
})

describe('Workbook.beginBatch / endBatch（批量结构变更事件抑制）', () => {
  it('批量内结构事件抑制，endBatch 合并补发一次（sheets-change / sheet-rename / active-sheet-change）', () => {
    const wb = new Workbook()
    wb.activeSheet.setCellValue({ row: 0, col: 0 }, 'x')
    wb.addSheet('Old2')

    const events: string[] = []
    wb.on('sheets-change', () => events.push('sheets-change'))
    wb.on('sheet-rename', ({ oldName, newName }) => events.push(`rename:${oldName}->${newName}`))
    wb.on('active-sheet-change', ({ index }) => events.push(`active:${index}`))

    wb.beginBatch()
    wb.removeSheet('Old2')
    wb.renameSheet('Sheet1', 'First')
    wb.addSheet('B')
    wb.addSheet('C')
    wb.activateSheet('C')
    expect(events).toEqual([]) // 批量中全部抑制
    wb.endBatch()

    // 合并补发：sheets-change（最终列表）→ rename → active（激活项变了）
    expect(events).toEqual(['sheets-change', 'rename:Sheet1->First', 'active:2'])
    expect(wb.getSheets().map((s) => s.name)).toEqual(['First', 'B', 'C'])
    expect(wb.activeSheet.name).toBe('C')
  })

  it('激活项未变的批量不补发 active-sheet-change；嵌套批量拍平', () => {
    const wb = new Workbook()
    wb.addSheet('Old2')

    const events: string[] = []
    wb.on('sheets-change', () => events.push('sheets-change'))
    wb.on('active-sheet-change', () => events.push('active'))

    wb.beginBatch()
    wb.beginBatch() // 嵌套
    wb.removeSheet('Old2')
    wb.addSheet('B')
    wb.endBatch() // 内层结束不补发
    expect(events).toEqual([])
    wb.endBatch()
    expect(events).toEqual(['sheets-change']) // 激活项未变（Sheet1 仍是激活）→ 无 active
  })

  it('endBatch 无进行中的批量抛错', () => {
    const wb = new Workbook()
    expect(() => wb.endBatch()).toThrow()
  })

  it('批量中异常：finally endBatch 仍补发事件，模型状态正确', () => {
    const wb = new Workbook()
    const events: string[] = []
    wb.on('sheets-change', () => events.push('sheets-change'))

    wb.beginBatch()
    wb.addSheet('B')
    try {
      throw new Error('boom')
    } catch {
      // 异常被调用方捕获；finally 保证收尾
    } finally {
      wb.endBatch()
    }
    expect(events).toEqual(['sheets-change'])
    expect(wb.getSheets().map((s) => s.name)).toEqual(['Sheet1', 'B'])
  })
})
