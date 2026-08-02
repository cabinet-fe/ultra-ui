import { describe, expect, it } from 'vitest'

import '../builtin'
import { createRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
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
  it('注册布局：history 组（undo/redo）在前，cell 组（merge/unmerge）在后', () => {
    const groups = defaultToolRegistry.getGroups()
    expect(groups.map((group) => group.name)).toEqual(['history', 'cell'])
    expect(groups[0]!.tools.map((tool) => tool.id)).toEqual(['undo', 'redo'])
    expect(groups[1]!.tools.map((tool) => tool.id)).toEqual(['merge', 'unmerge'])
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
})
