import { describe, expect, it } from 'vitest'

import { cellKey, parseRange } from '../../address'
import { Sheet } from '../../sheet'
import { buildBorderPresetItems, type BorderPreset, type BorderPresetItem } from '../border-presets'
import type { BorderEdge, CellStyle, CellStylePatch } from '../types'

const EDGE: BorderEdge = { style: 'thin', width: 1, color: '#000000' }

/** 无任何样式的 getStyle（邻居 null 边只在确有该边时生成） */
const noStyle = (): undefined => undefined

/** 每格四边都有的 getStyle（验证邻居同步全量 null 边） */
const fullStyle = (): CellStyle => ({
  border: { top: { ...EDGE }, right: { ...EDGE }, bottom: { ...EDGE }, left: { ...EDGE } }
})

/** items → Map<cellKey, border patch> 便于按格断言 */
function borderPatchMap(
  items: BorderPresetItem[]
): Map<number, NonNullable<CellStylePatch['border']>> {
  const map = new Map<number, NonNullable<CellStylePatch['border']>>()
  for (const item of items) map.set(cellKey(item.addr), item.patch.border ?? {})
  return map
}

function build(rangeText: string, preset: BorderPreset, getStyle = noStyle) {
  return buildBorderPresetItems(parseRange(rangeText)!, preset, EDGE, getStyle)
}

describe('buildBorderPresetItems：选区内补丁', () => {
  it('1x1：全边框 = 四边写入；外边框同；下边框仅 bottom；内边框空；无边框四边 null', () => {
    const all = borderPatchMap(build('B2', 'all'))
    expect(all.get(cellKey({ row: 1, col: 1 }))).toEqual({
      top: EDGE,
      right: EDGE,
      bottom: EDGE,
      left: EDGE
    })
    expect(all.size).toBe(1)

    const outer = borderPatchMap(build('B2', 'outer'))
    expect(outer.get(cellKey({ row: 1, col: 1 }))).toEqual({
      top: EDGE,
      right: EDGE,
      bottom: EDGE,
      left: EDGE
    })
    expect(outer.size).toBe(1)

    const bottom = borderPatchMap(build('B2', 'bottom'))
    expect(bottom.get(cellKey({ row: 1, col: 1 }))).toEqual({ bottom: EDGE })

    expect(build('B2', 'inner')).toHaveLength(0)

    const none = borderPatchMap(build('B2', 'none'))
    expect(none.get(cellKey({ row: 1, col: 1 }))).toEqual({
      top: null,
      right: null,
      bottom: null,
      left: null
    })
  })

  it('2x2 外边框：每格只写包围盒外缘边', () => {
    const map = borderPatchMap(build('A1:B2', 'outer'))
    expect(map.size).toBe(4)
    expect(map.get(cellKey({ row: 0, col: 0 }))).toEqual({ top: EDGE, left: EDGE })
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ top: EDGE, right: EDGE })
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ bottom: EDGE, left: EDGE })
    expect(map.get(cellKey({ row: 1, col: 1 }))).toEqual({ bottom: EDGE, right: EDGE })
  })

  it('3x3 外边框：中心格无补丁，边格一边、角格两边', () => {
    const map = borderPatchMap(build('A1:C3', 'outer'))
    expect(map.size).toBe(8)
    expect(map.has(cellKey({ row: 1, col: 1 }))).toBe(false) // 中心格
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ top: EDGE })
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ left: EDGE })
    expect(map.get(cellKey({ row: 1, col: 2 }))).toEqual({ right: EDGE })
    expect(map.get(cellKey({ row: 2, col: 1 }))).toEqual({ bottom: EDGE })
    expect(map.get(cellKey({ row: 0, col: 0 }))).toEqual({ top: EDGE, left: EDGE })
    expect(map.get(cellKey({ row: 2, col: 2 }))).toEqual({ bottom: EDGE, right: EDGE })
  })

  it('单行 / 单列外边框：每格写上下（或左右）+ 端点边', () => {
    const row = borderPatchMap(build('A1:C1', 'outer'))
    expect(row.size).toBe(3)
    expect(row.get(cellKey({ row: 0, col: 0 }))).toEqual({ top: EDGE, bottom: EDGE, left: EDGE })
    expect(row.get(cellKey({ row: 0, col: 1 }))).toEqual({ top: EDGE, bottom: EDGE })
    expect(row.get(cellKey({ row: 0, col: 2 }))).toEqual({ top: EDGE, bottom: EDGE, right: EDGE })

    const col = borderPatchMap(build('A1:A3', 'outer'))
    expect(col.size).toBe(3)
    expect(col.get(cellKey({ row: 0, col: 0 }))).toEqual({ top: EDGE, left: EDGE, right: EDGE })
    expect(col.get(cellKey({ row: 1, col: 0 }))).toEqual({ left: EDGE, right: EDGE })
    expect(col.get(cellKey({ row: 2, col: 0 }))).toEqual({ bottom: EDGE, left: EDGE, right: EDGE })
  })

  it('全边框：共享边双写一致（相邻格对侧边同一样式），不触碰选区外', () => {
    const items = build('A1:B2', 'all', fullStyle)
    const map = borderPatchMap(items)
    expect(map.size).toBe(4) // 仅选区 4 格，无邻居补丁
    for (const border of map.values()) {
      expect(border).toEqual({ top: EDGE, right: EDGE, bottom: EDGE, left: EDGE })
    }
    // 竖向共享边：A1.right 与 B1.left 同一样式
    expect(map.get(cellKey({ row: 0, col: 0 }))?.right).toEqual(
      map.get(cellKey({ row: 0, col: 1 }))?.left
    )
  })

  it('下边框：仅底行写 bottom（多行选区只作用底行）', () => {
    const map = borderPatchMap(build('A1:C3', 'bottom'))
    expect(map.size).toBe(3)
    for (let col = 0; col <= 2; col++) {
      expect(map.get(cellKey({ row: 2, col }))).toEqual({ bottom: EDGE })
    }
  })

  it('上边框：仅顶行写 top（多行选区只作用顶行）', () => {
    const map = borderPatchMap(build('A1:C3', 'top'))
    expect(map.size).toBe(3)
    for (let col = 0; col <= 2; col++) {
      expect(map.get(cellKey({ row: 0, col }))).toEqual({ top: EDGE })
    }
  })

  it('左边框：仅左列写 left（多列选区只作用左列）', () => {
    const map = borderPatchMap(build('A1:C3', 'left'))
    expect(map.size).toBe(3)
    for (let row = 0; row <= 2; row++) {
      expect(map.get(cellKey({ row, col: 0 }))).toEqual({ left: EDGE })
    }
  })

  it('右边框：仅右列写 right（多列选区只作用右列）', () => {
    const map = borderPatchMap(build('A1:C3', 'right'))
    expect(map.size).toBe(3)
    for (let row = 0; row <= 2; row++) {
      expect(map.get(cellKey({ row, col: 2 }))).toEqual({ right: EDGE })
    }
  })

  it('内边框：共享边双写一致，不写外缘；单格选区 = 空操作', () => {
    expect(build('B2', 'inner')).toHaveLength(0)

    const map = borderPatchMap(build('A1:B2', 'inner'))
    expect(map.size).toBe(4)
    // 竖向共享边：A1.right ↔ B1.left；横向共享边：A1.bottom ↔ A2.top
    expect(map.get(cellKey({ row: 0, col: 0 }))).toEqual({ right: EDGE, bottom: EDGE })
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ left: EDGE, bottom: EDGE })
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ right: EDGE, top: EDGE })
    expect(map.get(cellKey({ row: 1, col: 1 }))).toEqual({ left: EDGE, top: EDGE })
    expect(map.get(cellKey({ row: 0, col: 0 }))?.right).toEqual(
      map.get(cellKey({ row: 0, col: 1 }))?.left
    )
  })

  it('3x3 内边框：中心格四边、边格三边、角格两边；无外缘边', () => {
    const map = borderPatchMap(build('A1:C3', 'inner'))
    expect(map.size).toBe(9)
    expect(map.get(cellKey({ row: 1, col: 1 }))).toEqual({
      top: EDGE,
      right: EDGE,
      bottom: EDGE,
      left: EDGE
    })
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ right: EDGE, bottom: EDGE, left: EDGE })
    expect(map.get(cellKey({ row: 0, col: 0 }))).toEqual({ right: EDGE, bottom: EDGE })
    // 外缘边不写
    expect(map.get(cellKey({ row: 0, col: 0 }))).not.toHaveProperty('top')
    expect(map.get(cellKey({ row: 0, col: 0 }))).not.toHaveProperty('left')
  })

  it('单行 / 单列内边框：只产生内部竖边 / 横边', () => {
    const row = borderPatchMap(build('A1:C1', 'inner'))
    expect(row.size).toBe(3)
    expect(row.get(cellKey({ row: 0, col: 0 }))).toEqual({ right: EDGE })
    expect(row.get(cellKey({ row: 0, col: 1 }))).toEqual({ left: EDGE, right: EDGE })
    expect(row.get(cellKey({ row: 0, col: 2 }))).toEqual({ left: EDGE })

    const col = borderPatchMap(build('A1:A3', 'inner'))
    expect(col.size).toBe(3)
    expect(col.get(cellKey({ row: 0, col: 0 }))).toEqual({ bottom: EDGE })
    expect(col.get(cellKey({ row: 1, col: 0 }))).toEqual({ top: EDGE, bottom: EDGE })
    expect(col.get(cellKey({ row: 2, col: 0 }))).toEqual({ top: EDGE })
  })
})

describe('buildBorderPresetItems：邻居同步（共享边置空）', () => {
  it('外边框：选区外一圈邻居的对侧边写 null（确有该边才生成）', () => {
    const items = build('B2:C3', 'outer', fullStyle)
    const map = borderPatchMap(items)
    // 选区 4 格 + 邻居 8 格（四侧各 2 格）
    expect(map.size).toBe(12)
    // 上缘邻居（第 1 行）bottom: null
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ bottom: null })
    expect(map.get(cellKey({ row: 0, col: 2 }))).toEqual({ bottom: null })
    // 下缘邻居（第 4 行）top: null
    expect(map.get(cellKey({ row: 3, col: 1 }))).toEqual({ top: null })
    expect(map.get(cellKey({ row: 3, col: 2 }))).toEqual({ top: null })
    // 左缘邻居（A 列）right: null
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ right: null })
    expect(map.get(cellKey({ row: 2, col: 0 }))).toEqual({ right: null })
    // 右缘邻居（D 列）left: null
    expect(map.get(cellKey({ row: 1, col: 3 }))).toEqual({ left: null })
    expect(map.get(cellKey({ row: 2, col: 3 }))).toEqual({ left: null })
  })

  it('邻居无对应边时不生成补丁（noStyle → 无邻居项）', () => {
    expect(build('B2:C3', 'outer', noStyle)).toHaveLength(4)
    expect(build('B2:C3', 'none', noStyle)).toHaveLength(4)
    expect(build('B2:C3', 'bottom', noStyle)).toHaveLength(2)
    expect(build('B2:C3', 'top', noStyle)).toHaveLength(2)
    expect(build('B2:C3', 'left', noStyle)).toHaveLength(2)
    expect(build('B2:C3', 'right', noStyle)).toHaveLength(2)
    expect(build('B2:C3', 'inner', noStyle)).toHaveLength(4)
  })

  it('下边框：只同步底行下一行邻居的 top', () => {
    const items = build('B2:C3', 'bottom', fullStyle)
    const map = borderPatchMap(items)
    // 底行 2 格 + 下一行邻居 2 格（无其他侧邻居）
    expect(map.size).toBe(4)
    expect(map.get(cellKey({ row: 3, col: 1 }))).toEqual({ top: null })
    expect(map.get(cellKey({ row: 3, col: 2 }))).toEqual({ top: null })
  })

  it('上边框：只同步顶行上一行邻居的 bottom', () => {
    const items = build('B2:C3', 'top', fullStyle)
    const map = borderPatchMap(items)
    // 顶行 2 格 + 上一行邻居 2 格
    expect(map.size).toBe(4)
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ bottom: null })
    expect(map.get(cellKey({ row: 0, col: 2 }))).toEqual({ bottom: null })
  })

  it('左边框：只同步左列左侧邻居的 right', () => {
    const items = build('B2:C3', 'left', fullStyle)
    const map = borderPatchMap(items)
    // 左列 2 格 + 左侧邻居 2 格
    expect(map.size).toBe(4)
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ right: null })
    expect(map.get(cellKey({ row: 2, col: 0 }))).toEqual({ right: null })
  })

  it('右边框：只同步右列右侧邻居的 left', () => {
    const items = build('B2:C3', 'right', fullStyle)
    const map = borderPatchMap(items)
    // 右列 2 格 + 右侧邻居 2 格
    expect(map.size).toBe(4)
    expect(map.get(cellKey({ row: 1, col: 3 }))).toEqual({ left: null })
    expect(map.get(cellKey({ row: 2, col: 3 }))).toEqual({ left: null })
  })

  it('内边框：不触碰选区外邻居（即使邻居有边）', () => {
    const items = build('B2:C3', 'inner', fullStyle)
    const map = borderPatchMap(items)
    // 仅选区 4 格，无邻居补丁
    expect(map.size).toBe(4)
    expect(map.has(cellKey({ row: 0, col: 1 }))).toBe(false)
    expect(map.has(cellKey({ row: 3, col: 1 }))).toBe(false)
    expect(map.has(cellKey({ row: 1, col: 0 }))).toBe(false)
    expect(map.has(cellKey({ row: 1, col: 3 }))).toBe(false)
  })

  it('无边框：选区四边 null + 选区外一圈邻居对侧边 null', () => {
    const items = build('B2:C3', 'none', fullStyle)
    const map = borderPatchMap(items)
    expect(map.size).toBe(12)
    expect(map.get(cellKey({ row: 1, col: 1 }))).toEqual({
      top: null,
      right: null,
      bottom: null,
      left: null
    })
    expect(map.get(cellKey({ row: 0, col: 1 }))).toEqual({ bottom: null })
    expect(map.get(cellKey({ row: 1, col: 3 }))).toEqual({ left: null })
  })

  it('选区贴表格边缘（A1 起）：越界侧不产生邻居补丁', () => {
    const items = build('A1:B1', 'outer', fullStyle)
    const map = borderPatchMap(items)
    // 选区 2 格 + 下缘邻居 2 格 + 右缘邻居 1 格（上/左越界）
    expect(map.size).toBe(5)
    expect(map.get(cellKey({ row: 1, col: 0 }))).toEqual({ top: null })
    expect(map.get(cellKey({ row: 0, col: 2 }))).toEqual({ left: null })
  })
})

describe('边框预设 × SetCellStyleCommand（Sheet 集成）', () => {
  function applyPreset(sheet: Sheet, rangeText: string, preset: BorderPreset, edge = EDGE) {
    const items = buildBorderPresetItems(parseRange(rangeText)!, preset, edge, (addr) =>
      sheet.getCellStyle(addr)
    ).map(({ addr, patch }) => ({ addr, partial: patch }))
    sheet.setCellStyles(items)
  }

  it('外边框：邻居残留对侧边被置空（其余边保留），一次应用 = 单 undo 单元', () => {
    const sheet = new Sheet()
    // 右缘邻居 D2 预置 left + top 边（left 与选区共享）
    sheet.setCellStyle(parseRange('D2')!, {
      border: {
        top: { style: 'medium', width: 2, color: '#FF0000' },
        left: { style: 'thick', width: 3, color: '#00FF00' }
      }
    })
    const depth = sheet.history.undoSize

    applyPreset(sheet, 'B2:C3', 'outer')
    expect(sheet.history.undoSize).toBe(depth + 1)
    // 选区边缘格写入对应边
    expect(sheet.getCellStyle({ row: 1, col: 2 })?.border?.right).toEqual(EDGE)
    // 邻居 D2 的共享边 left 被删除，非共享边 top 保留
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.left).toBeUndefined()
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.top).toEqual({
      style: 'medium',
      width: 2,
      color: '#FF0000'
    })

    // undo 还原邻居格（共享边恢复）
    sheet.undo()
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.left).toEqual({
      style: 'thick',
      width: 3,
      color: '#00FF00'
    })
    expect(sheet.getCellStyle({ row: 1, col: 2 })).toBeUndefined()
    // redo 再次应用
    sheet.redo()
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.left).toBeUndefined()
  })

  it('连续设置：外边框改色再设 → 最近设置生效（共享边无新旧叠加）', () => {
    const sheet = new Sheet()
    applyPreset(sheet, 'B2:C3', 'outer')
    const red: BorderEdge = { style: 'thin', width: 1, color: '#FF0000' }
    applyPreset(sheet, 'B2:C3', 'outer', red)
    // 边缘格四边均为最近一次颜色
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toEqual({ top: red, left: red })
    expect(sheet.getCellStyle({ row: 2, col: 2 })?.border).toEqual({ bottom: red, right: red })
  })

  it('无边框：选区与邻居残留边全部清除，undo 还原双方', () => {
    const sheet = new Sheet()
    applyPreset(sheet, 'B2:C3', 'all')
    // 选区外邻居 D2 也带上共享边（模拟先前操作残留）
    sheet.setCellStyle(parseRange('D2:D3')!, { border: { left: { ...EDGE } } })
    const depth = sheet.history.undoSize

    applyPreset(sheet, 'B2:C3', 'none')
    expect(sheet.history.undoSize).toBe(depth + 1)
    expect(sheet.getCellStyle({ row: 1, col: 1 })).toBeUndefined()
    expect(sheet.getCellStyle({ row: 2, col: 2 })).toBeUndefined()
    // 右缘邻居的共享边 left 被清除（D2:D3 仅存 left → 纯样式格整体删除）
    expect(sheet.getCellStyle({ row: 1, col: 3 })).toBeUndefined()

    sheet.undo()
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toEqual({
      top: EDGE,
      right: EDGE,
      bottom: EDGE,
      left: EDGE
    })
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.left).toEqual(EDGE)
  })

  it('外边框不清除选区内部边（与 Excel 外侧框线语义一致）', () => {
    const sheet = new Sheet()
    applyPreset(sheet, 'B2:C3', 'all')
    applyPreset(sheet, 'B2:C3', 'outer')
    // 内部共享边保留（B2.right / C2.left 等仍为 all 写入的边）
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border?.right).toEqual(EDGE)
    expect(sheet.getCellStyle({ row: 1, col: 2 })?.border?.left).toEqual(EDGE)
  })

  it('下边框：底行写入 bottom，下一行邻居 top 置空', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(parseRange('B4')!, { border: { top: { ...EDGE } } })
    applyPreset(sheet, 'B2:C3', 'bottom')
    expect(sheet.getCellStyle({ row: 2, col: 1 })?.border).toEqual({ bottom: EDGE })
    expect(sheet.getCellStyle({ row: 2, col: 2 })?.border).toEqual({ bottom: EDGE })
    // 非底行不写
    expect(sheet.getCellStyle({ row: 1, col: 1 })).toBeUndefined()
    // 底行下一行邻居 B4 的 top 被清除
    expect(sheet.getCellStyle({ row: 3, col: 1 })).toBeUndefined()
  })

  it('上边框：顶行写入 top，上一行邻居 bottom 置空', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(parseRange('B1')!, { border: { bottom: { ...EDGE } } })
    applyPreset(sheet, 'B2:C3', 'top')
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toEqual({ top: EDGE })
    expect(sheet.getCellStyle({ row: 1, col: 2 })?.border).toEqual({ top: EDGE })
    expect(sheet.getCellStyle({ row: 2, col: 1 })).toBeUndefined()
    expect(sheet.getCellStyle({ row: 0, col: 1 })).toBeUndefined()
  })

  it('左边框：左列写入 left，左侧邻居 right 置空', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(parseRange('A2')!, { border: { right: { ...EDGE } } })
    applyPreset(sheet, 'B2:C3', 'left')
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toEqual({ left: EDGE })
    expect(sheet.getCellStyle({ row: 2, col: 1 })?.border).toEqual({ left: EDGE })
    expect(sheet.getCellStyle({ row: 1, col: 2 })).toBeUndefined()
    expect(sheet.getCellStyle({ row: 1, col: 0 })).toBeUndefined()
  })

  it('右边框：右列写入 right，右侧邻居 left 置空', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(parseRange('D2')!, { border: { left: { ...EDGE } } })
    applyPreset(sheet, 'B2:C3', 'right')
    expect(sheet.getCellStyle({ row: 1, col: 2 })?.border).toEqual({ right: EDGE })
    expect(sheet.getCellStyle({ row: 2, col: 2 })?.border).toEqual({ right: EDGE })
    expect(sheet.getCellStyle({ row: 1, col: 1 })).toBeUndefined()
    expect(sheet.getCellStyle({ row: 1, col: 3 })).toBeUndefined()
  })

  it('内边框：只写内部共享边，不触邻居', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(parseRange('D2')!, { border: { left: { ...EDGE } } })
    applyPreset(sheet, 'B2:C3', 'inner')
    expect(sheet.getCellStyle({ row: 1, col: 1 })?.border).toEqual({ right: EDGE, bottom: EDGE })
    expect(sheet.getCellStyle({ row: 1, col: 2 })?.border).toEqual({ left: EDGE, bottom: EDGE })
    // 邻居残留边保留
    expect(sheet.getCellStyle({ row: 1, col: 3 })?.border?.left).toEqual(EDGE)
  })
})
