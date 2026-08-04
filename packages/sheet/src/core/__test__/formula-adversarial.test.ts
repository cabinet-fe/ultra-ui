import { describe, expect, it, vi } from 'vitest'

import { parseRange } from '../address'
import { registerFormulaFunction } from '../formula/functions'
import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

const A1 = { row: 0, col: 0 }
const B1 = { row: 0, col: 1 }
const C1 = { row: 0, col: 2 }
const D1 = { row: 0, col: 3 }

describe('对抗：区域依赖', () => {
  it('删除区域公式后，区域内改动不再触发重算（ranged 反向索引清理）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellFormula(D1, '=SUM(A1:A10)')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 1 })

    sheet.setCellValue(D1, 0) // 删除公式
    const handler = vi.fn()
    sheet.on('cell-change', handler)
    sheet.setCellValue({ row: 5, col: 0 }, 99)
    // 只有 A6 自身变更；D1 已删公式不应重算
    expect(handler).toHaveBeenCalledTimes(1)
    expect(sheet.getCellData(D1)).toMatchObject({ v: 0 })
  })

  it('跨表区域公式改写后，Sheet2 改动不再触发 Sheet1 重算', () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.addSheet('Sheet2')
    sheet2.setCellValue(B1, 5)
    sheet1.setCellFormula(A1, '=SUM(Sheet2!B1:B10)')
    expect(sheet1.getCellData(A1)).toMatchObject({ v: 5 })

    // 改写为不引用 Sheet2 的公式 → 旧跨表区域依赖解除
    sheet1.setCellFormula(A1, '=1')
    const handler = vi.fn()
    sheet1.on('cell-change', handler)
    sheet2.setCellValue(B1, 99)
    expect(handler).not.toHaveBeenCalled()
    expect(sheet1.getCellData(A1)).toMatchObject({ v: 1 })
  })

  it('经由区域形成的循环：A1=SUM(B1:B2)，B1=A1+1 → 双格 #CYCLE!', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=SUM(B1:B2)')
    sheet.setCellFormula(B1, '=A1+1')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!', t: 'e' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!', t: 'e' })

    sheet.setCellValue(B1, 4)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 4 })
  })

  it('自包含区域：A1=SUM(A1:A3) → #CYCLE!', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=SUM(A1:A3)')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!', t: 'e' })
  })

  it('区域内的脏公式格：区域聚合拿到的是本轮新值（拓扑序）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B1, 2)
    sheet.setCellFormula({ row: 1, col: 0 }, '=B1*2') // A2，位于 A1:A3 区域内
    sheet.setCellFormula(D1, '=SUM(A1:A3)')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 4 })

    sheet.setCellValue(B1, 10)
    expect(sheet.getCellData({ row: 1, col: 0 })).toMatchObject({ v: 20 })
    expect(sheet.getCellData(D1)).toMatchObject({ v: 20 })
  })
})

describe('对抗：循环的生命周期', () => {
  it('循环建立的 undo/redo：状态精确还原', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=B1+1')
    expect(sheet.getCellData(A1)).toMatchObject({ v: 1 }) // B1 空 → 1
    sheet.history.clear()

    sheet.setCellFormula(B1, '=A1+1') // 成环
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!' })

    sheet.undo() // B1 公式撤销 → A1 复原
    expect(sheet.getCellData(B1)).toBeUndefined()
    expect(sheet.getCellData(A1)).toMatchObject({ v: 1 })

    sheet.redo() // 再次成环
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!' })
  })

  it('删除环上一格 → 另一格自动恢复', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=B1+1')
    sheet.setCellFormula(B1, '=A1+1')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!' })

    sheet.setCellValue(A1, null)
    expect(sheet.getCellData(A1)).toBeUndefined()
    expect(sheet.getCellData(B1)).toMatchObject({ v: 1 })
  })

  it('IF 未选分支中的静态自引用不算环（求值期动态检测）', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=IF(FALSE,A1+1,5)')
    expect(sheet.getCellData(A1)).toMatchObject({ v: 5 })
  })
})

describe('对抗：事务与回滚', () => {
  it('事务内公式写入 + 重算：提交后是一个 undo 单元', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(C1, '=A1+B1')
    sheet.history.clear()

    sheet.beginTransaction()
    sheet.setCellValue(A1, 3)
    sheet.setCellFormula(D1, '=C1*10')
    sheet.commit()
    expect(sheet.getCellData(C1)).toMatchObject({ v: 3 })
    expect(sheet.getCellData(D1)).toMatchObject({ v: 30 })
    expect(sheet.history.undoSize).toBe(1)

    sheet.undo()
    expect(sheet.getCellData(A1)).toBeUndefined()
    expect(sheet.getCellData(C1)).toMatchObject({ v: 0 })
    expect(sheet.getCellData(D1)).toBeUndefined()
  })

  it('事务回滚：公式与派生值全部还原，图节点清理', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    const nodesBefore = sheet.formulaGraph.nodeCount

    sheet.beginTransaction()
    sheet.setCellFormula(B1, '=A1*2')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 2 })
    sheet.rollback()

    expect(sheet.getCellData(B1)).toBeUndefined()
    expect(sheet.formulaGraph.nodeCount).toBe(nodesBefore)
    // 图已清理：改 A1 不再有任何重算
    const handler = vi.fn()
    sheet.on('cell-change', handler)
    sheet.setCellValue(A1, 9)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('对抗：合并与公式交互', () => {
  it('合并清除被覆盖格的值后，区域聚合同步变小', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 1, col: 1 }, 10) // B2
    sheet.setCellValue({ row: 2, col: 2 }, 5) // C3
    sheet.setCellFormula(D1, '=SUM(B2:C3)')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 15 })

    sheet.mergeCells(parseRange('B2:C3')!) // C3 被清空
    expect(sheet.getCellData(D1)).toMatchObject({ v: 10 })

    sheet.undo() // C3 恢复
    expect(sheet.getCellData(D1)).toMatchObject({ v: 15 })
  })

  it('合并把非锚点公式格的值（含公式）搬迁到锚点，公式继续求值', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellFormula({ row: 2, col: 2 }, '=A1+1') // C3：包围盒内唯一有值格
    sheet.mergeCells(parseRange('B2:C3')!)

    // 值保留规则：C3 的数据（含公式原文）迁到锚点 B2
    expect(sheet.getCellData({ row: 1, col: 1 })).toMatchObject({ f: 'A1+1', v: 6 })
    sheet.setCellValue(A1, 7)
    expect(sheet.getCellData({ row: 1, col: 1 })).toMatchObject({ v: 8 })
  })
})

describe('对抗：其它边界', () => {
  it('批量写入同一地址两次 + 公式依赖：undo 按逆序还原', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCells([
      { addr: A1, data: { v: 1, t: 'n' } },
      { addr: A1, data: { v: 2, t: 'n' } }
    ])
    expect(sheet.getCellData(A1)).toMatchObject({ v: 2 })
    expect(sheet.getCellData(B1)).toMatchObject({ v: 4 })

    sheet.undo()
    expect(sheet.getCellData(A1)).toBeUndefined()
    expect(sheet.getCellData(B1)).toMatchObject({ v: 0 })
  })

  it('数字文本参与算术（Excel 强转）', () => {
    const sheet = new Sheet()
    // 显式 t:'s'（绕过 setCellValue 规范化）——公式算术仍强转数字文本
    sheet.setCell(A1, { v: '5', t: 's' })
    sheet.setCellFormula(B1, '=A1+1')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 6 })
  })

  it('比较运算：文本大小写不敏感；混合类型 数字 < 文本 < 布尔', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '="apple"="APPLE"')
    expect(sheet.getCellData(A1)).toMatchObject({ v: true })
    sheet.setCellFormula(B1, '=1<"a"')
    expect(sheet.getCellData(B1)).toMatchObject({ v: true })
    sheet.setCellFormula(C1, '="a"<TRUE')
    expect(sheet.getCellData(C1)).toMatchObject({ v: true })
    sheet.setCellFormula(D1, '=A1=B1')
    expect(sheet.getCellData(D1)).toMatchObject({ v: true })
  })

  it('百分号作用于引用与表达式', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 50)
    sheet.setCellFormula(B1, '=A1%')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 0.5 })
    sheet.setCellFormula(C1, '=(20+30)%')
    expect(sheet.getCellData(C1)).toMatchObject({ v: 0.5 })
  })

  it('removeSheet 清理被删表的公式节点', () => {
    const workbook = new Workbook()
    const sheet2 = workbook.addSheet('Sheet2')
    sheet2.setCellFormula(A1, '=1+1')
    sheet2.setCellFormula(B1, '=A1*2')
    const before = workbook.formulaGraph.nodeCount
    expect(before).toBe(2)

    workbook.removeSheet('Sheet2')
    expect(workbook.formulaGraph.nodeCount).toBe(0)
  })

  it('求值期抛错的自定义函数 → #ERROR!（不击穿重算）', () => {
    registerFormulaFunction('__BOOM__', {
      impl() {
        throw new Error('boom')
      }
    })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=__BOOM__()')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#ERROR!', t: 'e' })
    // 其它公式格不受影响
    sheet.setCellFormula(B1, '=1+1')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 2 })
  })

  it('扩展注册表：自定义函数可正常使用', () => {
    registerFormulaFunction('__DOUBLE__', {
      minArgs: 1,
      maxArgs: 1,
      impl(args) {
        const n = typeof args[0] === 'number' ? args[0] : 0
        return n * 2
      }
    })
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=__DOUBLE__(21)')
    expect(sheet.getCellData(A1)).toMatchObject({ v: 42 })
  })
})
