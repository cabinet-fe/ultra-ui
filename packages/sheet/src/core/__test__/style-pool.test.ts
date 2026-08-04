import { describe, expect, it } from 'vitest'

import { normalizeStyle, StylePool } from '../style/style-pool'

describe('StylePool', () => {
  it('相同样式 intern 返回同一 id（内容去重）；不同样式不同 id', () => {
    const pool = new StylePool()
    const a = pool.intern({ fill: { color: '#FF0000' } })
    const b = pool.intern({ fill: { color: '#FF0000' } })
    expect(a).toBe(b)
    expect(pool.size).toBe(1)

    const c = pool.intern({ fill: { color: '#00FF00' } })
    expect(c).not.toBe(a)

    const d = pool.intern({
      fill: { color: '#FF0000' },
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })
    expect(d).not.toBe(a)
    expect(pool.size).toBe(3)
  })

  it('字段书写顺序与边顺序不影响去重（稳定序列化）', () => {
    const pool = new StylePool()
    const a = pool.intern({
      border: {
        bottom: { color: '#000000', width: 2, style: 'medium' },
        top: { style: 'thin', width: 1, color: '#111111' }
      }
    })
    const b = pool.intern({
      border: {
        top: { color: '#111111', style: 'thin', width: 1 },
        bottom: { style: 'medium', color: '#000000', width: 2 }
      }
    })
    expect(a).toBe(b)
  })

  it('归一化：空样式 / 空 fill / 空 border / 空边被剔除', () => {
    expect(normalizeStyle({})).toBeUndefined()
    expect(normalizeStyle({ fill: {} })).toBeUndefined()
    expect(normalizeStyle({ fill: { color: '' } })).toBeUndefined()
    expect(normalizeStyle({ border: {} })).toBeUndefined()
    expect(normalizeStyle({ border: { top: {} } })).toBeUndefined()
    expect(normalizeStyle({ fill: { color: '#FFFFFF' } })).toEqual({ fill: { color: '#FFFFFF' } })
    expect(normalizeStyle({ fill: { color: '#FFFFFF' }, border: { top: {} } })).toEqual({
      fill: { color: '#FFFFFF' }
    })
  })

  it('空样式不能 intern（调用方应先删除 s 字段）', () => {
    const pool = new StylePool()
    expect(() => pool.intern({})).toThrow('空样式')
  })

  it('get 返回副本，外部修改不影响池内定义', () => {
    const pool = new StylePool()
    const id = pool.intern({ fill: { color: '#FFFFFF' } })
    const style = pool.get(id)!
    style.fill!.color = '#000000'
    expect(pool.get(id)!.fill!.color).toBe('#FFFFFF')
  })

  it('snapshot/restore：内容一致且 id 映射一致（相同样式继续去重到同一 id）', () => {
    const pool = new StylePool()
    const a = pool.intern({ fill: { color: '#FF0000' } })
    const b = pool.intern({
      fill: { color: '#00FF00' },
      border: { top: { style: 'dashed', width: 1, color: '#000000' } }
    })

    const restored = new StylePool()
    restored.restore(pool.snapshot())
    expect(restored.size).toBe(pool.size)
    expect(restored.get(a)).toEqual(pool.get(a))
    expect(restored.get(b)).toEqual(pool.get(b))
    // 相同内容 → 同一 id（id 映射一致）
    expect(restored.intern({ fill: { color: '#FF0000' } })).toBe(a)
    // 新样式 id 接续原序列
    const c = restored.intern({ fill: { color: '#0000FF' } })
    expect(c).toBe(b + 1)
    expect(restored.get(c)).toEqual({ fill: { color: '#0000FF' } })
  })

  it('restore 后快照往返一致（restore(snapshot()) 幂等）', () => {
    const pool = new StylePool()
    pool.intern({ fill: { color: '#112233' } })
    pool.intern({ border: { left: { style: 'dotted', width: 2, color: '#AABBCC' } } })
    const snap = pool.snapshot()
    pool.restore(snap)
    expect(pool.snapshot()).toEqual(snap)
  })

  it('restore 中重复定义防御性跳过（保持首个 id）', () => {
    const pool = new StylePool()
    pool.restore([
      { fill: { color: '#FF0000' } },
      { fill: { color: '#FF0000' } },
      { fill: { color: '#00FF00' } }
    ])
    expect(pool.size).toBe(2)
    expect(pool.intern({ fill: { color: '#FF0000' } })).toBe(1)
    expect(pool.intern({ fill: { color: '#00FF00' } })).toBe(2)
  })

  it('font/align：不同样式不撞 key；同内容同 id；字段顺序无关', () => {
    const pool = new StylePool()
    const a = pool.intern({
      font: { color: '#FF0000', bold: true, size: 14 },
      align: { horizontal: 'center', wrap: true }
    })
    const b = pool.intern({
      align: { wrap: true, horizontal: 'center' },
      font: { size: 14, bold: true, color: '#FF0000' }
    })
    expect(a).toBe(b)
    expect(pool.size).toBe(1)

    const c = pool.intern({ font: { color: '#FF0000', bold: true, size: 14 } })
    expect(c).not.toBe(a)
    const d = pool.intern({
      font: { color: '#FF0000', bold: true, size: 14 },
      align: { horizontal: 'left', wrap: true }
    })
    expect(d).not.toBe(a)
    expect(pool.size).toBe(3)
  })

  it('归一化：空 font/align / 假值字段被剔除', () => {
    expect(normalizeStyle({ font: {} })).toBeUndefined()
    expect(normalizeStyle({ font: { bold: false, color: '' } })).toBeUndefined()
    expect(normalizeStyle({ align: { wrap: false } })).toBeUndefined()
    expect(normalizeStyle({ font: { bold: true }, align: {} })).toEqual({ font: { bold: true } })
  })
})
