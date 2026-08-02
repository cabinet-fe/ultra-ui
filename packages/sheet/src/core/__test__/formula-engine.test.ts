import { describe, expect, it, vi } from 'vitest'

import { parseRange, type CellAddress } from '../address'
import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

const A1 = { row: 0, col: 0 }
const B1 = { row: 0, col: 1 }
const C1 = { row: 0, col: 2 }
const D1 = { row: 0, col: 3 }

describe('依赖重算', () => {
  it('改 A1 → 依赖它的 =A1*2 重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 3)
    sheet.setCellFormula(B1, '=A1*2')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 6 })

    sheet.setCellValue(A1, 10)
    expect(sheet.getCellData(B1)).toMatchObject({ v: 20 })
  })

  it('间接依赖按拓扑序重算：A1 → B1(=A1*2) → C1(=B1+1)', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    expect(sheet.getCellData(C1)).toMatchObject({ v: 3 })

    sheet.setCellValue(A1, 5)
    // 若顺序错误（C1 先于 B1 重算）会拿到旧 B1 的 2+1=3
    expect(sheet.getCellData(B1)).toMatchObject({ v: 10 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 11 })
  })

  it('菱形依赖（D1=B1+C1，B1/C1 同依赖 A1）只算一次且结果正确', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 2)
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=A1*3')
    sheet.setCellFormula(D1, '=B1+C1')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 10 })

    sheet.setCellValue(A1, 4)
    expect(sheet.getCellData(D1)).toMatchObject({ v: 20 })
  })

  it('连续改值，每次重算结果一致', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    for (const [input, b, c] of [
      [1, 2, 3],
      [2, 4, 5],
      [3, 6, 7],
      [2, 4, 5],
      [0, 0, 1]
    ] as const) {
      sheet.setCellValue(A1, input)
      expect(sheet.getCellData(B1)).toMatchObject({ v: b })
      expect(sheet.getCellData(C1)).toMatchObject({ v: c })
    }
  })

  it('重算收敛时值未变的格不产生派生变更（不触发 cell-change）', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(B1, '=A1*0+1')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 1 })

    const handler = vi.fn()
    sheet.on('cell-change', handler)
    sheet.setCellValue(A1, 99)
    // 只有 A1 自身变更；B1 收敛（恒为 1）不应有事件
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ addr: A1 })
  })
})

describe('循环引用', () => {
  it('A1==B1+1, B1==A1+1 → 双格 #CYCLE!；打破循环自动恢复', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=B1+1')
    sheet.setCellFormula(B1, '=A1+1')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!', t: 'e' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!', t: 'e' })

    // 打破循环：B1 改为常量 → A1 恢复
    sheet.setCellValue(B1, 5)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 6, t: 'n' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: 5 })
  })

  it('环外格引用环上格 → 错误传播（自身不入环）', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=B1+1')
    sheet.setCellFormula(B1, '=A1+1')
    sheet.setCellFormula(C1, '=A1*2')
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#CYCLE!', t: 'e' })

    // 打破循环后环外格一并恢复
    sheet.setCellValue(B1, 2)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 3 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 6 })
  })

  it('自引用 A1==A1+1 → #CYCLE!，改常量后恢复', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=A1+1')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!', t: 'e' })

    sheet.setCellValue(A1, 10)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 10 })
  })

  it('跨表循环：Sheet1!A1 ↔ Sheet2!B1 → 双格 #CYCLE!，打破后恢复', () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.addSheet('Sheet2')
    sheet1.setCellFormula(A1, '=Sheet2!B1+1')
    sheet2.setCellFormula(B1, '=Sheet1!A1+1')
    expect(sheet1.getCellData(A1)).toMatchObject({ v: '#CYCLE!', t: 'e' })
    expect(sheet2.getCellData(B1)).toMatchObject({ v: '#CYCLE!', t: 'e' })

    sheet2.setCellValue(B1, 3)
    expect(sheet1.getCellData(A1)).toMatchObject({ v: 4 })
  })

  it('循环期间其它无关变更不影响环状态', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=B1+1')
    sheet.setCellFormula(B1, '=A1+D1')
    sheet.setCellFormula(C1, '=A1+1')
    // A1 → B1 → A1 成环（D1 是环上引用）；C1 环外
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!' })
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#CYCLE!' })

    // 改 D1（环的输入）→ 重算后仍是环
    sheet.setCellValue(D1, 10)
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#CYCLE!' })
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#CYCLE!' })
  })
})

describe('跨表引用', () => {
  it('Sheet2 值变更 → Sheet1 引用格实时重算；undo 一并还原', () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.addSheet('Sheet2')
    sheet2.setCellValue(A1, 10)
    sheet1.setCellFormula(B1, '=Sheet2!A1*2')
    expect(sheet1.getCellData(B1)).toMatchObject({ v: 20 })

    sheet2.setCellValue(A1, 7)
    expect(sheet1.getCellData(B1)).toMatchObject({ v: 14 })

    // 变更发生在 Sheet2，单次 undo 同时还原 Sheet2 源格与 Sheet1 派生格
    expect(sheet2.undo()).toBe(true)
    expect(sheet2.getCellData(A1)).toMatchObject({ v: 10 })
    expect(sheet1.getCellData(B1)).toMatchObject({ v: 20 })
  })

  it('引用不存在的 sheet → #REF!', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=Nope!B2')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#REF!', t: 'e' })
    sheet.setCellFormula(B1, "=SUM('No Sheet'!A1:B2)")
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#REF!', t: 'e' })
  })

  it("跨表区域：'S2'!A1:B2 聚合", () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const s2 = workbook.addSheet('S2')
    s2.setCellValue(A1, 1)
    s2.setCellValue({ row: 1, col: 1 }, 2)
    sheet1.setCellFormula(A1, "=SUM('S2'!A1:B2)")
    expect(sheet1.getCellData(A1)).toMatchObject({ v: 3 })

    // 区域内空格变更也触发重算
    s2.setCellValue({ row: 0, col: 1 }, 10)
    expect(sheet1.getCellData(A1)).toMatchObject({ v: 13 })
  })

  it('删除被引用的 sheet：缓存仍旧值，下次重算 → #REF!（已知限制行为）', () => {
    const workbook = new Workbook()
    const sheet1 = workbook.activeSheet
    const sheet2 = workbook.addSheet('Sheet2')
    sheet2.setCellValue(A1, 10)
    sheet1.setCellFormula(B1, '=Sheet2!A1+D1')
    sheet1.setCellValue(D1, 1)
    expect(sheet1.getCellData(B1)).toMatchObject({ v: 11 })

    workbook.removeSheet('Sheet2')
    expect(workbook.formulaGraph.getSheet('Sheet2')).toBeUndefined()
    // 删除本身不触发重算（已知限制）：缓存仍旧值
    expect(sheet1.getCellData(B1)).toMatchObject({ v: 11 })
    // 任意触发源变更 → 重算时表已不存在 → #REF!
    sheet1.setCellValue(D1, 2)
    expect(sheet1.getCellData(B1)).toMatchObject({ v: '#REF!', t: 'e' })
  })
})

describe('错误值体系', () => {
  it('三类错误：除零 #DIV/0!、类型错误 #VALUE!、未知函数 #NAME?', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=1/0')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#DIV/0!', t: 'e' })
    sheet.setCellFormula(B1, '=1+"abc"')
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#VALUE!', t: 'e' })
    sheet.setCellFormula(C1, '=NOSUCHFN(1)')
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#NAME?', t: 'e' })
  })

  it('0 作除数与 0 的负幂 → #DIV/0!；非法幂 → #VALUE!', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=0/0')
    expect(sheet.getCellData(A1)).toMatchObject({ v: '#DIV/0!' })
    sheet.setCellFormula(B1, '=0^-1')
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#DIV/0!' })
    sheet.setCellFormula(C1, '=(-1)^0.5')
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#VALUE!' })
  })

  it('错误沿依赖链传播，源修复后恢复', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=1/0')
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#DIV/0!' })
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#DIV/0!' })

    sheet.setCellValue(A1, 5)
    expect(sheet.getCellData(B1)).toMatchObject({ v: 10 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 11 })
  })

  it('区域直接作为公式结果 → #VALUE!', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellFormula(B1, '=A1:A3')
    expect(sheet.getCellData(B1)).toMatchObject({ v: '#VALUE!', t: 'e' })
  })
})

describe('undo/redo 集成', () => {
  it('改值波及 10 格公式链 → 单次 undo 全部还原', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    // B1..K1 共 10 格链：B1=A1+1, C1=B1+1, …
    const chain: CellAddress[] = []
    for (let col = 1; col <= 10; col++) {
      const prev = { row: 0, col: col - 1 }
      const addr = { row: 0, col }
      sheet.setCellFormula(addr, `=${String.fromCharCode(64 + col)}1+1`)
      chain.push(addr)
    }
    expect(sheet.getCellData(chain[9]!)).toMatchObject({ v: 11 })
    sheet.history.clear()

    sheet.setCellValue(A1, 100)
    expect(sheet.getCellData(chain[9]!)).toMatchObject({ v: 110 })
    // 源变更 + 10 格派生 = 一个 undo 单元
    expect(sheet.history.undoSize).toBe(1)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellData(A1)).toMatchObject({ v: 1 })
    for (const [i, addr] of chain.entries()) {
      expect(sheet.getCellData(addr)).toMatchObject({ v: i + 2 })
    }

    expect(sheet.redo()).toBe(true)
    expect(sheet.getCellData(chain[9]!)).toMatchObject({ v: 110 })
  })

  it('undo 公式输入：公式、缓存与波及变更一步还原', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    sheet.history.clear()

    sheet.setCellFormula(D1, '=C1*10')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 110 })

    sheet.undo()
    expect(sheet.getCellData(D1)).toBeUndefined()

    sheet.redo()
    expect(sheet.getCellData(D1)).toMatchObject({ f: 'C1*10', v: 110 })
  })

  it('undo 公式删除 → 依赖图复原，再次改值照常重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    const nodesBefore = sheet.formulaGraph.nodeCount

    // 删除 B1 的公式（写常量覆盖）→ C1 按 B1 新值重算
    sheet.setCellValue(B1, 0)
    expect(sheet.getCellData(B1)).toMatchObject({ v: 0 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 1 })
    expect(sheet.formulaGraph.nodeCount).toBe(nodesBefore - 1)

    // undo 删除 → 公式、缓存、派生值、图节点全部复原
    sheet.undo()
    expect(sheet.getCellData(B1)).toMatchObject({ f: 'A1*2', v: 10 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 11 })
    expect(sheet.formulaGraph.nodeCount).toBe(nodesBefore)

    // 图确实复原：再改 A1 仍触发 B1/C1 重算
    sheet.setCellValue(A1, 7)
    expect(sheet.getCellData(B1)).toMatchObject({ v: 14 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: 15 })
  })
})

describe('公式与合并单元格（对抗场景）', () => {
  it('引用合并格：锚点有值、被覆盖格按空（原始存储语义）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 1, col: 1 }, 10) // B2
    sheet.mergeCells(parseRange('B2:C3')!)

    sheet.setCellFormula(D1, '=B2')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 10 })
    // C3 是被覆盖格 → 空 → 0
    sheet.setCellFormula({ row: 0, col: 4 }, '=C3+1')
    expect(sheet.getCellData({ row: 0, col: 4 })).toMatchObject({ v: 1 })
    // 区域含合并：只锚点计数一次
    sheet.setCellFormula({ row: 0, col: 5 }, '=SUM(B2:C3)')
    expect(sheet.getCellData({ row: 0, col: 5 })).toMatchObject({ v: 10 })
  })

  it('公式格作为合并锚点：合并后公式保留且继续重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellFormula({ row: 1, col: 1 }, '=A1+1') // B2
    sheet.mergeCells(parseRange('B2:C3')!)

    expect(sheet.getCellData({ row: 1, col: 1 })).toMatchObject({ f: 'A1+1', v: 6 })
    sheet.setCellValue(A1, 7)
    expect(sheet.getCellData({ row: 1, col: 1 })).toMatchObject({ v: 8 })
  })

  it('被覆盖格上的公式被合并清除：节点移除 + 依赖者重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 1, col: 1 }, 10) // B2 锚点
    sheet.setCellFormula({ row: 2, col: 2 }, '=B2+1') // C3 将被覆盖
    sheet.setCellFormula(D1, '=C3*2')
    expect(sheet.getCellData(D1)).toMatchObject({ v: 22 })
    const nodesBefore = sheet.formulaGraph.nodeCount

    sheet.mergeCells(parseRange('B2:C3')!)
    // C3 数据被清空 → 公式节点移除；D1 按 C3 空值重算
    expect(sheet.getCellData({ row: 2, col: 2 })).toBeUndefined()
    expect(sheet.formulaGraph.nodeCount).toBe(nodesBefore - 1)
    expect(sheet.getCellData(D1)).toMatchObject({ v: 0 })

    // undo 合并 → C3 公式恢复，D1 回到 22
    sheet.undo()
    expect(sheet.getCellData({ row: 2, col: 2 })).toMatchObject({ f: 'B2+1', v: 11 })
    expect(sheet.getCellData(D1)).toMatchObject({ v: 22 })
  })
})

describe('公式生命周期（对抗场景）', () => {
  it('删除公式后依赖图清理：原依赖格改动不再触发重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellFormula(B1, '=A1*2')
    sheet.setCellFormula(C1, '=B1+1')
    expect(sheet.formulaGraph.nodeCount).toBe(2)

    // 清空 B1（删除公式）→ C1 按空值重算
    sheet.setCellValue(B1, null)
    expect(sheet.getCellData(B1)).toBeUndefined()
    expect(sheet.getCellData(C1)).toMatchObject({ v: 1 })
    expect(sheet.formulaGraph.nodeCount).toBe(1)

    // A1 改动不再有任何依赖者
    const handler = vi.fn()
    sheet.on('cell-change', handler)
    sheet.setCellValue(A1, 99)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(sheet.getCellData(C1)).toMatchObject({ v: 1 })
  })

  it('公式改公式：依赖边切换（旧依赖不再触发，新依赖生效）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellValue(B1, 10)
    sheet.setCellFormula(C1, '=A1+1')
    expect(sheet.getCellData(C1)).toMatchObject({ v: 2 })

    sheet.setCellFormula(C1, '=B1+1')
    expect(sheet.getCellData(C1)).toMatchObject({ v: 11 })

    // 旧依赖 A1 改动不再影响 C1
    sheet.setCellValue(A1, 100)
    expect(sheet.getCellData(C1)).toMatchObject({ v: 11 })
    // 新依赖 B1 生效
    sheet.setCellValue(B1, 20)
    expect(sheet.getCellData(C1)).toMatchObject({ v: 21 })
  })

  it('同公式重复输入 = 无操作（不入历史）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.setCellFormula(B1, '=A1*2')
    const depth = sheet.history.undoSize

    sheet.setCellFormula(B1, '=A1*2')
    expect(sheet.history.undoSize).toBe(depth)
    expect(sheet.getCellData(B1)).toMatchObject({ v: 2 })
  })

  it("'=' 单独输入 = 清除单元格", () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 5)
    sheet.setCellValue(A1, '=')
    expect(sheet.getCellData(A1)).toBeUndefined()
    // 空格输入 '=' 也是无操作
    expect(sheet.canUndo).toBe(true) // 仍有上面两条历史
    sheet.setCellValue(B1, '=')
    expect(sheet.getCellData(B1)).toBeUndefined()
  })

  it('A1:A1 单格区域', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 42)
    sheet.setCellFormula(B1, '=SUM(A1:A1)')
    expect(sheet.getCellData(B1)).toMatchObject({ v: 42 })
  })

  it('公式引用空区域 → SUM 为 0、COUNT 为 0、AVERAGE #DIV/0!', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(A1, '=SUM(D1:E9)')
    sheet.setCellFormula(B1, '=COUNT(D1:E9)')
    sheet.setCellFormula(C1, '=AVERAGE(D1:E9)')
    expect(sheet.getCellData(A1)).toMatchObject({ v: 0 })
    expect(sheet.getCellData(B1)).toMatchObject({ v: 0 })
    expect(sheet.getCellData(C1)).toMatchObject({ v: '#DIV/0!' })
  })

  it('批量写入（粘贴场景）：重算派生并入同一 undo 单元', () => {
    const sheet = new Sheet()
    sheet.setCellFormula(C1, '=A1+B1')
    sheet.history.clear()

    sheet.setCells([
      { addr: A1, data: { v: 1, t: 'n' } },
      { addr: B1, data: { v: 2, t: 'n' } }
    ])
    expect(sheet.getCellData(C1)).toMatchObject({ v: 3 })
    expect(sheet.history.undoSize).toBe(1)

    sheet.undo()
    expect(sheet.getCellData(A1)).toBeUndefined()
    expect(sheet.getCellData(B1)).toBeUndefined()
    expect(sheet.getCellData(C1)).toMatchObject({ v: 0 })
  })

  it('setCell 直接写带 f 的 CellData 同样走重算', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 6)
    sheet.setCell(B1, { f: 'A1*2' })
    expect(sheet.getCellData(B1)).toMatchObject({ f: 'A1*2', v: 12, t: 'n' })
  })
})
