import { createRange } from '@veltra/sheet-core/core/address'

import '../builtin'
import { Sheet } from '@veltra/sheet-core/core/sheet'
import { Workbook } from '@veltra/sheet-core/core/workbook'
import { describe, expect, it, vi } from 'vitest'

import { createSheetContext } from '../context'
import { exportSheetCsvFile, exportWorkbookFile } from '../download'
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
  it('注册布局：history / cell / text / edit / insert / file 六组；structure/freeze 已移除', () => {
    const groups = defaultToolRegistry.getGroups()
    expect(groups.map((group) => group.name)).toEqual([
      'history',
      'cell',
      'text',
      'edit',
      'insert',
      'file'
    ])
    expect(groups[0]!.tools.map((tool) => tool.id)).toEqual(['undo', 'redo'])
    expect(groups[1]!.tools.map((tool) => tool.id)).toEqual([
      'border',
      'fill-color',
      'merge',
      'unmerge'
    ])
    expect(groups[2]!.tools.map((tool) => tool.id)).toEqual([
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'font-color',
      'font-size',
      'align-left',
      'align-center',
      'align-right',
      'valign-top',
      'valign-middle',
      'valign-bottom',
      'wrap-text'
    ])
    expect(groups[3]!.tools.map((tool) => tool.id)).toEqual(['find'])
    expect(groups[4]!.tools.map((tool) => tool.id)).toEqual(['insert-image'])
    expect(groups[5]!.tools.map((tool) => tool.id)).toEqual(['import', 'export'])

    for (const id of [
      'insert-rows',
      'insert-cols',
      'delete-rows',
      'delete-cols',
      'freeze',
      'freeze-row',
      'freeze-col',
      'unfreeze',
      'export-xlsx',
      'export-csv'
    ]) {
      expect(defaultToolRegistry.has(id)).toBe(false)
    }
  })

  it('全部保留工具带 icon', () => {
    for (const group of defaultToolRegistry.getGroups()) {
      for (const tool of group.tools) {
        expect(tool.icon, `${tool.id} 缺少 icon`).toBeTruthy()
      }
    }
  })

  it('导入导出工具：import 直接选文件、export 为弹层型；导出下载辅助不依赖选区', async () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const exportTool = mustGet('export')
    const importTool = mustGet('import')

    expect(importTool.popup).toBeUndefined()
    expect(exportTool.popup).toBe('export')
    // 无 workbook 的上下文：导出辅助空操作（不抛错）
    expect(() => exportWorkbookFile(ctx)).not.toThrow()
    expect(() => exportSheetCsvFile(ctx)).not.toThrow()
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
      exportWorkbookFile(ctx)
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      const blob = createObjectURL.mock.calls[0]![0] as Blob
      expect(blob.type).toContain('spreadsheetml')

      createObjectURL.mockClear()
      exportSheetCsvFile(ctx)
      await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalled(), { timeout: 2000 })
      const csvBlob = createObjectURL.mock.calls[0]![0] as Blob
      expect(csvBlob.type).toContain('text/csv')
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })

  it('导出 xlsx：sheet 名含 Excel 非法字符时 reject（sheet-core 写入校验，错误传播给调用方）', async () => {
    const workbook = new Workbook()
    workbook.renameSheet('Sheet1', 'a:b')
    const ctx = createSheetContext(workbook.activeSheet, workbook)
    await expect(exportWorkbookFile(ctx)).rejects.toThrow(/Sheet name/)
  })

  it('样式工具：弹层型声明 + 无选区禁用；填充/边框面板不直接写（onClick 为空）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const fill = mustGet('fill-color')
    const border = mustGet('border')

    expect(fill.popup).toBe('fill-color')
    expect(border.popup).toBe('border')
    // 默认 A1 有选区 → 可用
    expect(fill.disabled?.(ctx)).toBe(false)
    sheet.selection.clear()
    expect(fill.disabled?.(ctx)).toBe(true)
    expect(border.disabled?.(ctx)).toBe(true)
  })

  it('合并：单格禁用；选区恰等于既有合并时禁用；可合并时执行', () => {
    const sheet = new Sheet()
    const merge = mustGet('merge')
    const unmerge = mustGet('unmerge')

    // 默认 A1 单格 → 合并禁用、取消合并禁用
    expect(isDisabled(merge, sheet)).toBe(true)
    expect(isDisabled(unmerge, sheet)).toBe(true)

    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))
    expect(isDisabled(merge, sheet)).toBe(false)
    merge.onClick(createSheetContext(sheet))
    expect(sheet.getCellInfo({ row: 0, col: 0 }).mergeRange).toEqual(
      createRange({ row: 0, col: 0 }, { row: 1, col: 1 })
    )
    // 选区恰等于合并 → 合并禁用；取消合并可用
    expect(isDisabled(merge, sheet)).toBe(true)
    expect(isDisabled(unmerge, sheet)).toBe(false)
    unmerge.onClick(createSheetContext(sheet))
    expect(sheet.getCellInfo({ row: 0, col: 0 }).mergeRange).toBeUndefined()
  })

  it('undo/redo：disabled 读 canUndo/canRedo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const undo = mustGet('undo')
    const redo = mustGet('redo')

    expect(undo.disabled?.(ctx)).toBe(true)
    expect(redo.disabled?.(ctx)).toBe(true)
    sheet.setCellValue({ row: 0, col: 0 }, 'x')
    expect(undo.disabled?.(ctx)).toBe(false)
    undo.onClick(ctx)
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(redo.disabled?.(ctx)).toBe(false)
    redo.onClick(ctx)
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'x', t: 's' })
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

    // 默认 A1 落在合并内 → 可见；移出后不可见；再点覆盖格仍可见
    expect(tool.visible?.(ctx)).toBe(true)
    ctx.selectCell({ row: 3, col: 3 })
    expect(tool.visible?.(ctx)).toBe(false)
    ctx.selectCell({ row: 1, col: 1 })
    expect(tool.visible?.(ctx)).toBe(true)
  })

  it('查找工具：弹层型声明（popup: find），组 edit', () => {
    const find = mustGet('find')
    expect(find.popup).toBe('find')
    expect(find.group).toBe('edit')
    expect(find.disabled).toBeUndefined()
  })

  it('插入图片工具：弹层型声明（popup: insert-image），组 insert；无选区禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const tool = mustGet('insert-image')
    expect(tool.popup).toBe('insert-image')
    expect(tool.group).toBe('insert')
    expect(tool.disabled?.(ctx)).toBe(false)
    sheet.selection.clear()
    expect(tool.disabled?.(ctx)).toBe(true)
  })

  it('文本工具：toggle 以活动格为基准统一翻转；active 高亮；对齐互斥取反', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const bold = mustGet('bold')
    const alignCenter = mustGet('align-center')
    const wrap = mustGet('wrap-text')

    expect(mustGet('font-color').popup).toBe('font-color')
    expect(mustGet('font-size').popup).toBe('font-size')

    // 默认 A1：active 假；点 B → 加粗 + active
    expect(bold.active?.(ctx)).toBe(false)
    bold.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.font?.bold).toBe(true)
    expect(bold.active?.(ctx)).toBe(true)
    // 再点 → 取消
    bold.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
    expect(bold.active?.(ctx)).toBe(false)

    // 混合选区：活动格未加粗 → 全加粗
    sheet.setCellStyle(createRange({ row: 0, col: 0 }, { row: 0, col: 0 }), {
      font: { bold: true }
    })
    sheet.setCellValue({ row: 0, col: 1 }, 'x')
    ctx.selectRange(createRange({ row: 0, col: 0 }, { row: 0, col: 1 }), { row: 0, col: 1 })
    expect(bold.active?.(ctx)).toBe(false) // 活动格 B1 未加粗
    bold.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 0 })?.font?.bold).toBe(true)
    expect(sheet.getCellStyle({ row: 0, col: 1 })?.font?.bold).toBe(true)

    // 对齐：点居中 → 再点清除
    alignCenter.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 1 })?.align?.horizontal).toBe('center')
    expect(alignCenter.active?.(ctx)).toBe(true)
    alignCenter.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 1 })?.align?.horizontal).toBeUndefined()

    wrap.onClick(ctx)
    expect(sheet.getCellStyle({ row: 0, col: 1 })?.align?.wrap).toBe(true)
    expect(wrap.active?.(ctx)).toBe(true)
  })
})
