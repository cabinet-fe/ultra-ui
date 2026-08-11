import { describe, expect, it } from 'vitest'

import type { CellOverlayRect, GridOverlayLayout } from '../designer/cell-coords'
import { resolveBindingFloatPanelPosition } from '../designer/use-grid-overlay'

function cellRect(top: number, height = 24): CellOverlayRect {
  const bottom = top + height
  return {
    left: 100,
    top,
    right: 180,
    bottom,
    width: 80,
    height,
    centerX: 140,
    centerY: top + height / 2
  }
}

const layout: GridOverlayLayout = { offsetX: 0, offsetY: 77, viewW: 640, viewH: 400 }

describe('resolveBindingFloatPanelPosition', () => {
  it('顶行格空间不足时改在单元格下方', () => {
    const rect = cellRect(101)
    const position = resolveBindingFloatPanelPosition(rect, layout, 320, 68, 640)

    expect(position.placement).toBe('below')
    expect(position.top).toBe(rect.bottom + 8)
  })

  it('中部格优先在单元格上方', () => {
    const rect = cellRect(200)
    const position = resolveBindingFloatPanelPosition(rect, layout, 320, 68, 640)

    expect(position.placement).toBe('above')
    expect(position.top).toBe(rect.top - 8)
  })

  it('水平居中并限制在宿主宽度内', () => {
    const rect = cellRect(200)
    const position = resolveBindingFloatPanelPosition(rect, layout, 320, 68, 340)

    expect(position.left).toBe(170)
  })
})
