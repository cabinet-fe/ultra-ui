import { describe, expect, it, vi } from 'vitest'

import { createGrid, flushMicrotasks } from './grid-test-utils'

describe('整表只读模式', () => {
  it('不注册编辑器：startEdit 拒绝、双击/Enter 无编辑会话', () => {
    const { grid, table } = createGrid({ readonly: true })
    try {
      expect(table.startEdit(0, 0)).toBe(false)
      expect(table.isEditing()).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('保留渲染/选区/右键回调（守入口不守模型）', async () => {
    const seen: unknown[] = []
    const { grid, container, sheet } = createGrid({
      readonly: true,
      onContextMenu: (info) => seen.push(info)
    })
    try {
      container.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 200,
          clientY: 100
        })
      )
      await flushMicrotasks()
      expect(seen).toHaveLength(1)
      // 模型层不设防：写入口只在 grid（预览器不暴露命令入口）
      sheet.setCellValue({ row: 0, col: 0 }, 'ro')
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe('ro')
    } finally {
      grid.release()
    }
  })
})

describe('单元格级只读（填报场景）', () => {
  it('只读格 startEdit 拒绝，其余格正常（meta 运行期生效）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellReadonly({ row: 1, col: 1 }, true)
      expect(table.startEdit(1, 1)).toBe(false)
      expect(table.startEdit(0, 0)).toBe(true)
      table.cancelEdit()

      sheet.setCellReadonly({ row: 1, col: 1 }, false)
      expect(table.startEdit(1, 1)).toBe(true)
      table.cancelEdit()
    } finally {
      grid.release()
    }
  })
})

describe('公式格', () => {
  it('显示计算缓存值；编辑初值为公式原文（所见即所编）', async () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      sheet.setCellFormula({ row: 0, col: 0 }, '1+1')
      await flushMicrotasks()
      expect(table.getCellText(0, 0)).toBe('2')

      expect(table.startEdit(0, 0)).toBe(true)
      const input = container.querySelector('input')
      expect(input).not.toBeNull()
      expect((input as HTMLInputElement).value).toBe('=1+1')

      // 编辑改写提交：'=' 前缀自动走公式命令
      ;(input as HTMLInputElement).value = '=2+3'
      table.commitEdit()
      await flushMicrotasks()
      expect(sheet.getCellData({ row: 0, col: 0 })?.f).toBe('2+3')
      expect(table.getCellText(0, 0)).toBe('5')
    } finally {
      grid.release()
    }
  })

  it('编辑提交与取消均触发 onEditEnd（镜像退出挂钩点）', () => {
    const onEditEnd = vi.fn()
    const { grid, table } = createGrid({ onEditEnd })
    try {
      table.startEdit(0, 0)
      table.commitEdit()
      expect(onEditEnd).toHaveBeenCalledTimes(1)
      expect(onEditEnd).toHaveBeenLastCalledWith({ row: 0, col: 0 })

      table.startEdit(1, 1)
      table.cancelEdit()
      expect(onEditEnd).toHaveBeenCalledTimes(2)
      expect(onEditEnd).toHaveBeenLastCalledWith({ row: 1, col: 1 })
    } finally {
      grid.release()
    }
  })
})
