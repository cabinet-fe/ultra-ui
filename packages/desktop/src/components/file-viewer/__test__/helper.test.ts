import { describe, expect, it } from 'vite-plus/test'

import {
  FILE_VIEWER_KIND_LABEL,
  ZOOM_MAX,
  ZOOM_MIN,
  clampRenderScale,
  clampZoom,
  inferKind
} from '../helper'

describe('file-viewer helper', () => {
  it('.ofd 按 OFD 类别识别，不落入 text 兜底', () => {
    expect(inferKind('invoice.ofd')).toBe('ofd')
  })

  it('OFD 类别的展示标签为 OFD', () => {
    expect(FILE_VIEWER_KIND_LABEL.ofd).toBe('OFD')
  })
})

describe('clampZoom', () => {
  it('低于下限时收敛到 ZOOM_MIN', () => {
    expect(clampZoom(0.49)).toBe(ZOOM_MIN)
    expect(clampZoom(0)).toBe(ZOOM_MIN)
  })

  it('高于上限时收敛到 ZOOM_MAX', () => {
    expect(clampZoom(3.1)).toBe(ZOOM_MAX)
    expect(clampZoom(100)).toBe(ZOOM_MAX)
  })

  it('区间内保留两位小数', () => {
    expect(clampZoom(1.234)).toBe(1.23)
    expect(clampZoom(2.005)).toBe(2.01)
    expect(clampZoom(1)).toBe(1)
  })
})

describe('clampRenderScale', () => {
  it('普通页面在 canvas 上限内，不降采样', () => {
    expect(clampRenderScale(612, 792, 2)).toBe(1)
    expect(clampRenderScale(595, 842, 3)).toBe(1)
  })

  it('超大页面被钳制到 canvas 单边与面积上限内', () => {
    const k = clampRenderScale(20000, 20000, 8)
    expect(k).toBeLessThan(1)
    expect(k).toBeCloseTo(0.1024, 4)

    const w = 20000 * 8 * k
    const h = 20000 * 8 * k
    expect(w).toBeLessThanOrEqual(32767)
    expect(h).toBeLessThanOrEqual(32767)
    expect(w * h).toBeLessThanOrEqual(2 ** 28)
  })

  it('单边超限时按单边上限降采样', () => {
    const k = clampRenderScale(65534, 100, 1)
    expect(k).toBeLessThan(1)
    expect(65534 * k).toBeLessThanOrEqual(32767)
  })
})
