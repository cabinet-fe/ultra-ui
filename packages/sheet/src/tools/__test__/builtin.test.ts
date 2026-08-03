import { describe, expect, it } from 'vitest'

import '../builtin'
import { createRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
import { Workbook } from '../../core/workbook'
import { createSheetContext } from '../context'
import { defaultToolRegistry, type SheetTool } from '../registry'

function mustGet(id: string): SheetTool {
  const tool = defaultToolRegistry.get(id)
  if (!tool) throw new Error(`内置工具未注册: ${id}`)
  return tool
}

function isDisabled(tool: SheetTool, sheet: Sheet): boolean {
  return tool.disabled?.(createSheetContext(sheet)) ?? false
}

describe('内置工具（dogfood 扩展机制）', () => {
  it('注册布局：history / cell / freeze / default / file 五组', () => {
    const groups = defaultToolRegistry.getGroups()
    expect(groups.map((group) => group.name)).toEqual([
      'history',
      'cell',
      'freeze',
      'default',
      'file'
    ])
    expect(groups[0]!.tools.map((tool) => tool.id)).toEqual(['undo', 'redo'])
    expect(groups[1]!.tools.map((tool) => tool.id)).toEqual([
      'merge',
      'unmerge',
      'fill-color',
      'border'
    ])
    expect(groups[2]!.tools.map((tool) => tool.id)).toEqual([
      'freeze',
      'freeze-row',
      'freeze-col',
      'unfreeze'
    ])
    expect(groups[3]!.tools.map((tool) => tool.id)).toEqual(['find'])
    expect(groups[4]!.tools.map((tool) => tool.id)).toEqual(['export-xlsx', 'export-csv', 'import'])
  })

  it('导入导出工具：import 为弹层型；导出不依赖选区恒可用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const exportXlsx = mustGet('export-xlsx')
    const exportCsv = mustGet('export-csv')
    const importTool = mustGet('import')

    expect(importTool.popup).toBe('import')
    // 导出整个工作簿 / 活动表：无选区也可用
    expect(exportXlsx.disabled?.(ctx)).toBeUndefined()
    expect(exportCsv.disabled?.(ctx)).toBeUndefined()
    // 无 workbook 的上下文：导出 onClick 空操作（不抛错）
    expect(() => exportXlsx.onClick(ctx)).not.toThrow()
    expect(() => exportCsv.onClick(ctx)).not.toThrow()
  })

  it('导出 xlsx / csv：生成 Blob 下载（workbook 传入时）', async () => {
    const workbook = new Workbook()
    workbook.activeSheet.setCellValue({ row: 0, col: 0 }, 42)
    const ctx = createSheetContext(workbook.activeSheet, workbook)

    // stub 浏览器下载 API（happy-dom 无 createObjectURL）
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL
    try {
      mustGet('export-xlsx').onClick(ctx)
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      const blob = createObjectURL.mock.calls[0]![0] as Blob
      expect(blob.type).toContain('spreadsheetml')

      createObjectURL.mockClear()
      mustGet('export-csv').onClick(ctx)
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      const csvBlob = createObjectURL.mock.calls[0]![0] as Blob
      expect(csvBlob.type).toContain('text/csv')
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })

  it('样式工具：弹层型声明 + 无选区禁用；填充/边框面板不直接写（onClick 为空）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const fill = mustGet('fill-color')
    const border = mustGet('border')

    expect(fill.popup).toBe('fill-color')
    expect(border.popup).toBe('border')

    // 无选区：禁用
    expect(fill.disabled?.(ctx)).toBe(true)
    expect(border.disabled?.(ctx)).toBe(true)

    ctx.selectCell({ row: 0, col: 0 })
    expect(fill.disabled?.(ctx)).toBe(false)
    expect(border.disabled?.(ctx)).toBe(false)
  })

  it('undo/redo 的 disabled 随 history 状态联动', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const undo = mustGet('undo')
    const redo = mustGet('redo')

    // 空历史：两者禁用
    expect(undo.disabled?.(ctx)).toBe(true)
    expect(redo.disabled?.(ctx)).toBe(true)

    sheet.setCellValue({ row: 0, col: 0 }, 1)
    expect(undo.disabled?.(ctx)).toBe(false)
    expect(redo.disabled?.(ctx)).toBe(true)

    undo.onClick(ctx)
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(undo.disabled?.(ctx)).toBe(true)
    expect(redo.disabled?.(ctx)).toBe(false)

    redo.onClick(ctx)
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 1, t: 'n' })
  })

  it('merge：无选区/单格禁用，拖选区域可用，合并已有合并区域时禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const merge = mustGet('merge')

    // 无选区
    expect(merge.disabled?.(ctx)).toBe(true)

    // 单格选区
    ctx.selectCell({ row: 0, col: 0 })
    expect(merge.disabled?.(ctx)).toBe(true)

    // 区域选区 → 可用
    const range = createRange({ row: 0, col: 0 }, { row: 1, col: 1 })
    ctx.selectRange(range)
    expect(merge.disabled?.(ctx)).toBe(false)

    merge.onClick(ctx)
    expect(sheet.merges.getMergeAt({ row: 0, col: 0 })).toEqual(range)

    // 选区恰好等于既有合并区域 → 禁用（避免空操作历史条目）
    expect(merge.disabled?.(ctx)).toBe(true)

    // 合并可 undo
    ctx.undo()
    expect(sheet.merges.getMergeAt({ row: 0, col: 0 })).toBeUndefined()
  })

  it('unmerge：活动格不在合并内禁用，在合并内可用且可 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const unmerge = mustGet('unmerge')

    const range = createRange({ row: 0, col: 0 }, { row: 1, col: 2 })
    sheet.mergeCells(range)
    sheet.history.clear()

    // 无选区
    expect(unmerge.disabled?.(ctx)).toBe(true)

    // 普通格
    ctx.selectCell({ row: 5, col: 5 })
    expect(unmerge.disabled?.(ctx)).toBe(true)

    // 被覆盖格 → 解析锚点后在合并内
    ctx.selectCell({ row: 1, col: 2 })
    expect(ctx.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    expect(unmerge.disabled?.(ctx)).toBe(false)

    unmerge.onClick(ctx)
    expect(sheet.merges.getMergeAt({ row: 0, col: 0 })).toBeUndefined()

    ctx.undo()
    expect(sheet.merges.getMergeAt({ row: 0, col: 0 })).toEqual(range)
  })

  it('visible 随选区联动（自定义工具）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.mergeCells(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))

    // 只在活动格位于合并区域内时可见的工具
    const tool: SheetTool = {
      id: 'merged-only',
      title: '合并格工具',
      visible: (toolCtx) => {
        const active = toolCtx.getSelection().activeCell
        return !!active && !!toolCtx.getCellInfo(active).mergeRange
      },
      onClick: () => {}
    }

    expect(tool.visible?.(ctx)).toBe(false)
    ctx.selectCell({ row: 1, col: 1 })
    expect(tool.visible?.(ctx)).toBe(true)
    ctx.selectCell({ row: 3, col: 3 })
    expect(tool.visible?.(ctx)).toBe(false)
  })

  it('冻结工具：无选区禁用 freeze；active 高亮读当前冻结值', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const freeze = mustGet('freeze')
    const freezeRow = mustGet('freeze-row')
    const freezeCol = mustGet('freeze-col')
    const unfreeze = mustGet('unfreeze')

    // 初始：freeze 无选区禁用；unfreeze 无冻结禁用；首行/首列未激活
    expect(freeze.disabled?.(ctx)).toBe(true)
    expect(unfreeze.disabled?.(ctx)).toBe(true)
    expect(freezeRow.active?.(ctx)).toBe(false)
    expect(freezeCol.active?.(ctx)).toBe(false)

    ctx.selectCell({ row: 2, col: 3 })
    expect(freeze.disabled?.(ctx)).toBe(false)
    // 冻结到当前行列：D3 → rows = 3, cols = 4
    freeze.onClick(ctx)
    expect(ctx.frozen).toEqual({ rows: 3, cols: 4 })
    expect(freeze.active?.(ctx)).toBe(true)
    expect(freezeRow.active?.(ctx)).toBe(true)
    expect(freezeCol.active?.(ctx)).toBe(true)
    expect(unfreeze.disabled?.(ctx)).toBe(false)

    // 冻结首行：保留冻结列，行改为 1
    freezeRow.onClick(ctx)
    expect(ctx.frozen).toEqual({ rows: 1, cols: 4 })
    expect(freezeRow.active?.(ctx)).toBe(true)
    expect(freeze.active?.(ctx)).toBe(false) // 不再是「当前行列」状态

    // 冻结首列：保留冻结行，列改为 1
    freezeCol.onClick(ctx)
    expect(ctx.frozen).toEqual({ rows: 1, cols: 1 })

    // 取消冻结
    unfreeze.onClick(ctx)
    expect(ctx.frozen).toEqual({ rows: 0, cols: 0 })
    expect(freezeRow.active?.(ctx)).toBe(false)
    expect(freezeCol.active?.(ctx)).toBe(false)
    expect(unfreeze.disabled?.(ctx)).toBe(true)
  })

  it('冻结不产生历史条目（同 rowHeights 先例）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.selectCell({ row: 1, col: 1 })
    mustGet('freeze').onClick(ctx)
    expect(sheet.history.undoSize).toBe(0)
    expect(ctx.canUndo).toBe(false)
  })

  it('查找工具：弹层型声明（popup: find），onClick 为空', () => {
    const find = mustGet('find')
    expect(find.popup).toBe('find')
    expect(find.disabled).toBeUndefined()
  })
})
