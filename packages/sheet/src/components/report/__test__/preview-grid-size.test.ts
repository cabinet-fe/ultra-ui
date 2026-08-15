import type { SheetSnapshot } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { previewGridSize } from '../preview-grid-size'

function snap(
  partial: Partial<SheetSnapshot> & Pick<SheetSnapshot, 'cells'>
): Pick<SheetSnapshot, 'cells' | 'merges' | 'meta' | 'rows'> {
  return { merges: [], rows: 0, ...partial }
}

describe('previewGridSize', () => {
  it('template 模式用内容包围盒，忽略设计态 canvas 尺寸', () => {
    expect(
      previewGridSize(
        snap({
          cells: [
            { row: 0, col: 0, v: '客户' },
            { row: 0, col: 1, v: '金额' }
          ],
          rows: 24,
          cols: 10
        }),
        'template'
      )
    ).toEqual({ rows: 1, cols: 2 })
  })

  it('filled 模式行保留展开布局尺寸，列按包围盒收敛（去掉设计态撑大的列）', () => {
    expect(
      previewGridSize(
        snap({
          cells: [
            { row: 0, col: 0, v: '客户' },
            { row: 3, col: 1, v: 300 }
          ],
          rows: 4,
          cols: 10
        }),
        'filled'
      )
    ).toEqual({ rows: 4, cols: 2 })
  })

  it('空快照至少 1×1（VTable 需要非零网格）', () => {
    expect(previewGridSize(snap({ cells: [] }), 'template')).toEqual({ rows: 1, cols: 1 })
  })

  it('包围盒计入合并区终点与 meta 绑定格', () => {
    expect(
      previewGridSize(
        snap({
          cells: [{ row: 0, col: 0, v: '标题' }],
          merges: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
          meta: [{ row: 2, col: 1, namespace: 'report', payload: {} }],
          rows: 24,
          cols: 10
        }),
        'template'
      )
    ).toEqual({ rows: 3, cols: 3 })
  })
})
