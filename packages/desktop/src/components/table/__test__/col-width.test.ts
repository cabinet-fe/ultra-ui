import { describe, expect, it } from 'vitest'

import type { TableColumn } from '../../../types'
import { allocateLeafColumnWidths } from '../allocate-column-widths'
import { ColumnNode } from '../node/col'

function createLeaf(column: TableColumn): ColumnNode {
  return new ColumnNode(column, 0, 0)
}

describe('allocateLeafColumnWidths', () => {
  it('fixed right 操作列未设 width 时保持 minWidth，不吞剩余空间', () => {
    const name = createLeaf({ key: 'name', name: '姓名', width: 200 })
    const age = createLeaf({ key: 'age', name: '年龄', width: 200 })
    const action = createLeaf({ key: 'action', name: '操作', fixed: 'right' })
    // 模拟上一次分配曾把操作列撑大
    action.allocatedWidth = 800

    allocateLeafColumnWidths([name, age, action], 1000)

    expect(name.width).toBe(200)
    expect(age.width).toBe(200)
    expect(action.allocatedWidth).toBeUndefined()
    expect(action.width).toBe(100)
  })

  it('多个非 fixed 无 width 列均分剩余宽度', () => {
    const a = createLeaf({ key: 'a', name: 'A', width: 200 })
    const b = createLeaf({ key: 'b', name: 'B' })
    const c = createLeaf({ key: 'c', name: 'C' })

    // totalBase = 200 + 100 + 100 = 400，剩余 600，每列 +300
    allocateLeafColumnWidths([a, b, c], 1000)

    expect(a.width).toBe(200)
    expect(b.width).toBe(400)
    expect(c.width).toBe(400)
  })

  it('fixed left 未设 width 时同样不参与均分', () => {
    const name = createLeaf({ key: 'name', name: '姓名', fixed: 'left' })
    const age = createLeaf({ key: 'age', name: '年龄' })
    const score = createLeaf({ key: 'score', name: '分数' })

    // totalBase = 100 + 100 + 100 = 300，剩余 700 只分给 age/score
    allocateLeafColumnWidths([name, age, score], 1000)

    expect(name.allocatedWidth).toBeUndefined()
    expect(name.width).toBe(100)
    expect(age.width).toBe(450)
    expect(score.width).toBe(450)
  })

  it('explicitWidth 列宽度不变', () => {
    const locked = createLeaf({ key: 'locked', name: '锁定', width: 180 })
    locked.explicitWidth = true
    const grow = createLeaf({ key: 'grow', name: '弹性' })

    allocateLeafColumnWidths([locked, grow], 500)

    expect(locked.width).toBe(180)
    // totalBase = 180 + 100 = 280，剩余 220 全给 grow
    expect(grow.width).toBe(320)
  })

  it('无剩余空间时 grow 列回落到 minWidth', () => {
    const a = createLeaf({ key: 'a', name: 'A', width: 400 })
    const b = createLeaf({ key: 'b', name: 'B' })
    b.allocatedWidth = 300

    allocateLeafColumnWidths([a, b], 450)

    expect(a.width).toBe(400)
    expect(b.allocatedWidth).toBeUndefined()
    expect(b.width).toBe(100)
  })

  it('分配结果不写入列配置，森林重建后容器变窄仍会收缩', () => {
    const config: TableColumn[] = [
      { key: 'a', name: 'A' },
      { key: 'b', name: 'B' }
    ]

    // 第一次挂载：宽容器
    const first = config.map((c, i) => new ColumnNode(c, i, 0))
    allocateLeafColumnWidths(first, 2000)
    expect(first[0]!.width).toBe(1000)
    expect(first[1]!.width).toBe(1000)

    // 分配结果不得污染用户的列配置对象
    expect(config[0]!.width).toBeUndefined()
    expect(config[1]!.width).toBeUndefined()

    // 模拟森林重建（路由返回 / v-if / columns 引用变化）：
    // 同一批列配置对象不应被误判为显式设宽
    const rebuilt = config.map((c, i) => new ColumnNode(c, i, 0))
    expect(rebuilt.every((node) => !node.explicitWidth)).toBe(true)

    // 容器变窄后重新分配，列宽相应收缩
    allocateLeafColumnWidths(rebuilt, 800)
    expect(rebuilt[0]!.width).toBe(400)
    expect(rebuilt[1]!.width).toBe(400)
  })

  it('显式宽度（配置/拖拽锁定）优先于分配宽度并使其作废', () => {
    const col = createLeaf({ key: 'a', name: 'A' })
    col.allocatedWidth = 500
    expect(col.width).toBe(500)

    // 模拟表头拖拽锁定
    col.width = 300
    col.explicitWidth = true

    expect(col.data.width).toBe(300)
    expect(col.allocatedWidth).toBeUndefined()
    expect(col.width).toBe(300)
  })
})
