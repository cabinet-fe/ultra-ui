import { describe, expect, it, vi } from 'vite-plus/test'

import { Sheet } from '../../core/sheet'
import type { GridCellEditor, GridEditorSession } from '../index'
import {
  createGrid,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  HEADER_HEIGHT,
  ROW_HEADER_WIDTH
} from './grid-test-utils'

/** 记录 open 会话的 spy 编辑器 */
function spyEditor(name: string): GridCellEditor & { sessions: GridEditorSession[] } {
  const sessions: GridEditorSession[] = []
  return {
    name,
    sessions,
    open: vi.fn((session: GridEditorSession) => {
      sessions.push(session)
    }),
    close: vi.fn()
  }
}

describe('类型化编辑器机制（grid-editors）', () => {
  it('按格路由：命中自定义编辑器接管会话（open 收到地址/初值/容器/矩形），引擎文本会话不残留', () => {
    const editor = spyEditor('pick')
    const { grid, table, container, sheet } = createGrid({
      editors: { editors: [editor], route: (addr) => (addr.col === 1 ? 'pick' : undefined) }
    })
    try {
      sheet.setCellValue({ row: 0, col: 1 }, 'opt-a')
      expect(table.startEdit(1, 0)).toBe(true)
      // 接管后引擎无残留文本会话
      expect(table.isEditing()).toBe(false)
      expect(editor.open).toHaveBeenCalledTimes(1)
      const session = editor.sessions[0]!
      expect(session.addr).toEqual({ row: 0, col: 1 })
      expect(session.value).toBe('opt-a')
      expect(session.container).toBe(container)
      // 锚定矩形与几何常量对齐（行号列 46 / 列头 28 / 列宽 80 / 行高 28）
      expect(session.rect).toEqual({
        x: ROW_HEADER_WIDTH + DEFAULT_COL_WIDTH,
        y: HEADER_HEIGHT,
        width: DEFAULT_COL_WIDTH,
        height: DEFAULT_ROW_HEIGHT
      })
    } finally {
      grid.release()
    }
  })

  it('提交通道：commit 写模型（可 undo）、显示刷新、编辑器回收，onEditStart/onEditEnd 对齐触发', () => {
    const editor = spyEditor('pick')
    const onEditStart = vi.fn()
    const onEditEnd = vi.fn()
    const { grid, table, sheet } = createGrid({
      editors: { editors: [editor], route: () => 'pick' },
      onEditStart,
      onEditEnd
    })
    try {
      sheet.setCellValue({ row: 0, col: 1 }, 'opt-a')
      expect(table.startEdit(1, 0)).toBe(true)
      expect(onEditStart).toHaveBeenCalledWith({ row: 0, col: 1 })
      editor.sessions[0]!.commit('opt-b')
      expect(sheet.getCellData({ row: 0, col: 1 })?.v).toBe('opt-b')
      expect(table.getCellText(1, 0)).toBe('opt-b')
      expect(editor.close).toHaveBeenCalledTimes(1)
      expect(onEditEnd).toHaveBeenCalledWith({ row: 0, col: 1 })
      // 提交走模型命令系统：可撤销
      expect(sheet.undo()).toBe(true)
      expect(sheet.getCellData({ row: 0, col: 1 })?.v).toBe('opt-a')
    } finally {
      grid.release()
    }
  })

  it('取消：cancel 不写模型，编辑器回收', () => {
    const editor = spyEditor('pick')
    const { grid, table, sheet } = createGrid({
      editors: { editors: [editor], route: () => 'pick' }
    })
    try {
      sheet.setCellValue({ row: 0, col: 1 }, 'keep')
      expect(table.startEdit(1, 0)).toBe(true)
      editor.sessions[0]!.cancel()
      expect(sheet.getCellData({ row: 0, col: 1 })?.v).toBe('keep')
      expect(editor.close).toHaveBeenCalledTimes(1)
      // 会话已结束：再次 cancel 幂等（无会话）
      expect(() => editor.sessions[0]!.cancel()).not.toThrow()
    } finally {
      grid.release()
    }
  })

  it('未命中路由（undefined / 未注册名）回落统一文本编辑器：引擎会话照常，输入提交回写模型', () => {
    const editor = spyEditor('pick')
    const { grid, table, container, sheet } = createGrid({
      editors: {
        editors: [editor],
        // col 0 未路由；col 2 路由到未注册名（回落语义）
        route: (addr) => (addr.col === 2 ? 'ghost' : addr.col === 1 ? 'pick' : undefined)
      }
    })
    try {
      expect(table.startEdit(0, 0)).toBe(true)
      expect(table.isEditing()).toBe(true)
      expect(editor.open).not.toHaveBeenCalled()
      const input = container.querySelector('input')
      expect(input).not.toBeNull()
      input!.value = 'typed'
      table.commitEdit()
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe('typed')

      expect(table.startEdit(2, 0)).toBe(true)
      expect(table.isEditing()).toBe(true)
      expect(editor.open).not.toHaveBeenCalled()
      table.cancelEdit()
      expect(table.isEditing()).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('readonly 下忽略编辑器机制（不接管文本编辑）', () => {
    const editor = spyEditor('pick')
    const { grid, table } = createGrid({
      readonly: true,
      editors: { editors: [editor], route: () => 'pick' }
    })
    try {
      // 只读：可编三级判定不放行，文本与自定义会话都不开启
      expect(table.startEdit(0, 0)).toBe(false)
      expect(editor.open).not.toHaveBeenCalled()
    } finally {
      grid.release()
    }
  })
})

describe('列头机制（grid-header）', () => {
  it('resolveTitle 覆盖列头标题，未覆盖列保持缺省字母表头', () => {
    const { grid, table } = createGrid({
      header: { resolveTitle: (col) => (col === 0 ? '字段A' : undefined) }
    })
    try {
      expect(table.options.columns[0]?.title).toBe('字段A')
      expect(table.options.columns[1]?.title).toBe('B')
      expect(table.options.columns[5]?.title).toBe('F')
    } finally {
      grid.release()
    }
  })

  it('不传 header 时列头仍为缺省字母表头（默认行为回归）', () => {
    const { grid, table } = createGrid()
    try {
      expect(table.options.columns[0]?.title).toBe('A')
      expect(table.options.columns[3]?.title).toBe('D')
    } finally {
      grid.release()
    }
  })

  it('resolveHeader 自定义表头：引擎列标题置空防双绘，覆盖层按列几何挂载定位，release 回收', () => {
    const el = document.createElement('div')
    el.textContent = '列头'
    const resolveHeader = vi.fn((col: number) => (col === 0 ? el : undefined))
    const { grid, container, table } = createGrid({ header: { resolveHeader } })
    try {
      expect(table.options.columns[0]?.title).toBe('')
      expect(table.options.columns[1]?.title).toBe('B')
      expect(el.parentElement).not.toBeNull()
      // 第 0 列几何：行号列宽 46 起、列宽 80、列头高 28
      expect(el.style.left).toBe(`${ROW_HEADER_WIDTH}px`)
      expect(el.style.width).toBe(`${DEFAULT_COL_WIDTH}px`)
      expect(el.style.height).toBe(`${HEADER_HEIGHT}px`)
      // 覆盖层挂进表格容器
      expect(container.contains(el)).toBe(true)
      // 每列至多回调一次（构造期列装配 + 覆盖层同步共用缓存）
      expect(resolveHeader).toHaveBeenCalledTimes(6)
    } finally {
      grid.release()
    }
    expect(el.parentElement).toBeNull()
  })
})

describe('列头机制与编辑器机制默认共存（新 Sheet 实例直挂）', () => {
  it('两个机制同时启用：自定义列头与按格编辑器互不干扰', () => {
    const editor = spyEditor('num')
    const el = document.createElement('span')
    const sheet = new Sheet()
    const { grid, table } = createGrid({
      sheet,
      header: { resolveHeader: (col) => (col === 0 ? el : undefined) },
      editors: { editors: [editor], route: (addr) => (addr.col === 0 ? 'num' : undefined) }
    })
    try {
      expect(table.options.columns[0]?.title).toBe('')
      expect(table.startEdit(0, 0)).toBe(true)
      expect(editor.open).toHaveBeenCalledTimes(1)
      editor.sessions[0]!.commit(7)
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe(7)
    } finally {
      grid.release()
    }
  })
})
