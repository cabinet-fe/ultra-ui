import { describe, expect, it } from 'vite-plus/test'

import {
  CHIP_EDGE_FADE,
  chipRevealScroll,
  chipWheelScroll,
  isChipClear,
  type ChipRevealMetrics
} from '../reveal'

function metrics(
  partial: Partial<ChipRevealMetrics> & Pick<ChipRevealMetrics, 'chipLeft' | 'chipRight'>
): ChipRevealMetrics {
  return { scrollLeft: 0, clientWidth: 200, scrollWidth: 800, fade: CHIP_EDGE_FADE, ...partial }
}

describe('chipWheelScroll', () => {
  it('纵向滚轮转成横向位移', () => {
    expect(chipWheelScroll(10, 200, 800, 0, 40)).toEqual({ left: 50, leftover: 0 })
  })

  it('横轴位移更大时不拦截', () => {
    expect(chipWheelScroll(10, 200, 800, 30, 10)).toBeNull()
  })

  it('未溢出时不拦截，到头后把剩余滚轮交出去', () => {
    expect(chipWheelScroll(0, 200, 200, 0, 40)).toBeNull()
    expect(chipWheelScroll(0, 200, 800, 0, -40)).toEqual({ left: 0, leftover: -40 })
    expect(chipWheelScroll(590, 200, 800, 0, 40)).toEqual({ left: 600, leftover: 30 })
  })
})

describe('chipRevealScroll', () => {
  it('没有溢出时，完整落在视口内的纸片不滚动', () => {
    const input = metrics({ chipLeft: 10, chipRight: 70, scrollWidth: 200 })
    expect(isChipClear(input)).toBe(true)
    expect(chipRevealScroll(input)).toBe(0)
  })

  it('右侧被截断时滚到纸片右缘离开遮罩', () => {
    const input = metrics({ chipLeft: 180, chipRight: 260 })
    expect(isChipClear(input)).toBe(false)
    expect(chipRevealScroll(input)).toBe(90)
  })

  it('完整可见但压在右侧渐变上时仍滚动', () => {
    const input = metrics({ chipLeft: 160, chipRight: 200 })
    expect(isChipClear(input)).toBe(false)
    expect(chipRevealScroll(input)).toBe(30)
  })

  it('压在左侧渐变上时向左滚出遮罩', () => {
    const input = metrics({ chipLeft: 100, chipRight: 140, scrollLeft: 100 })
    expect(isChipClear(input)).toBe(false)
    expect(chipRevealScroll(input)).toBe(70)
  })

  it('滚出左侧的纸片回到起点', () => {
    const input = metrics({ chipLeft: 0, chipRight: 40, scrollLeft: 100 })
    expect(chipRevealScroll(input)).toBe(0)
  })

  it('最后一张纸片滚到终点，终点一侧不再预留遮罩', () => {
    const input = metrics({ chipLeft: 720, chipRight: 800, scrollLeft: 400 })
    expect(chipRevealScroll(input)).toBe(600)
    expect(isChipClear(metrics({ chipLeft: 720, chipRight: 800, scrollLeft: 600 }))).toBe(true)
  })

  it('已经完全可见时保持当前 scrollLeft', () => {
    const input = metrics({ chipLeft: 140, chipRight: 200, scrollLeft: 100 })
    expect(isChipClear(input)).toBe(true)
    expect(chipRevealScroll(input)).toBe(100)
  })
})
