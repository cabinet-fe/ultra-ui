import type { CellAddress } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import {
  applyReportPreset,
  createReportBinding,
  formatBindingPlaceholder,
  formatCellAddress,
  inferColParentCandidate,
  inferDropPreset,
  inferParentsForPreset,
  inferReportPreset,
  inferRowParentCandidate,
  isExpansionBandRow,
  parseCellAddress,
  presetBindingPatch,
  presetStillApplies,
  setBindingCatalog
} from '../binding'
import type { DatasetCatalogItem, ReportBinding } from '../types'

/** 内联 catalog fixture（单一事实源在测试自身，不依赖 playground mock） */
const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'orderDate', label: '下单日期', type: 'date' }
  ]
}

setBindingCatalog([ORDERS_DATASET])

describe('report binding', () => {
  it('createReportBinding 默认 list + 纵向扩展 + 明细预设', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    expect(binding).toEqual({
      dataset: 'orders',
      field: 'amount',
      aggregate: 'list',
      expand: 'down',
      preset: 'detail',
      sort: 'none',
      conditionalRules: []
    })
  })

  it('formatBindingPlaceholder 中文标签（含 list / max / min）', () => {
    expect(formatBindingPlaceholder(createReportBinding(ORDERS_DATASET, 'amount'))).toBe(
      '明细 · 金额'
    )

    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    expect(formatBindingPlaceholder(group)).toBe('分组 · 客户')

    const sum = createReportBinding(ORDERS_DATASET, 'amount')
    sum.aggregate = 'sum'
    sum.expand = 'none'
    expect(formatBindingPlaceholder(sum)).toBe('求和 · 金额')

    const max = createReportBinding(ORDERS_DATASET, 'amount')
    max.aggregate = 'max'
    max.expand = 'none'
    expect(formatBindingPlaceholder(max)).toBe('最大 · 金额')

    const min = createReportBinding(ORDERS_DATASET, 'amount')
    min.aggregate = 'min'
    min.expand = 'none'
    expect(formatBindingPlaceholder(min)).toBe('最小 · 金额')
  })

  it('presetBindingPatch / applyReportPreset 映射表', () => {
    const rowParent = { row: 1, col: 0 }
    const colParent = { row: 0, col: 1 }
    const base: ReportBinding = {
      dataset: 'orders',
      field: 'amount',
      expand: 'down',
      aggregate: 'list',
      rowParent,
      colParent
    }

    expect(presetBindingPatch('groupHeader')).toEqual({
      preset: 'groupHeader',
      expand: 'down',
      aggregate: 'group'
    })
    expect(presetBindingPatch('groupHeader', { transpose: true })).toMatchObject({
      expand: 'right',
      aggregate: 'group'
    })

    expect(presetBindingPatch('detail')).toEqual({
      preset: 'detail',
      expand: 'down',
      aggregate: 'list'
    })
    expect(presetBindingPatch('detail', { transpose: true })).toMatchObject({
      expand: 'right',
      aggregate: 'list'
    })

    expect(presetBindingPatch('subtotal')).toEqual({
      preset: 'subtotal',
      expand: 'none',
      aggregate: 'sum'
    })
    expect(applyReportPreset(base, 'subtotal').rowParent).toEqual(rowParent)

    expect(presetBindingPatch('grandTotal')).toEqual({
      preset: 'grandTotal',
      expand: 'none',
      aggregate: 'sum',
      rowParent: undefined,
      colParent: undefined
    })
    expect(applyReportPreset(base, 'grandTotal').rowParent).toBeUndefined()
    expect(applyReportPreset(base, 'grandTotal').colParent).toBeUndefined()

    expect(presetBindingPatch('cross')).toEqual({
      preset: 'cross',
      expand: 'none',
      aggregate: 'sum'
    })
    expect(applyReportPreset(base, 'cross').rowParent).toEqual(rowParent)
    expect(applyReportPreset(base, 'cross').colParent).toEqual(colParent)
  })

  it('inferReportPreset 从字段组合推断预设', () => {
    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'customer',
        aggregate: 'group',
        expand: 'down'
      })
    ).toBe('groupHeader')

    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'orderNo',
        aggregate: 'list',
        expand: 'down',
        rowParent: { row: 1, col: 0 }
      })
    ).toBe('detail')

    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'amount',
        aggregate: 'sum',
        expand: 'none',
        rowParent: { row: 1, col: 0 }
      })
    ).toBe('subtotal')

    expect(
      inferReportPreset({ dataset: 'orders', field: 'amount', aggregate: 'sum', expand: 'none' })
    ).toBe('grandTotal')

    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'amount',
        aggregate: 'sum',
        expand: 'none',
        rowParent: { row: 1, col: 0 },
        colParent: { row: 0, col: 1 }
      })
    ).toBe('cross')

    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'amount',
        aggregate: 'avg',
        expand: 'none',
        rowParent: { row: 1, col: 0 }
      })
    ).toBe('subtotal')

    expect(
      inferReportPreset({
        dataset: 'orders',
        field: 'amount',
        aggregate: 'sum',
        expand: 'none',
        colParent: { row: 0, col: 1 }
      })
    ).toBe('subtotal')
  })

  it('presetStillApplies 同族内改聚合仍成立', () => {
    const subtotal: ReportBinding = {
      dataset: 'orders',
      field: 'amount',
      preset: 'subtotal',
      aggregate: 'avg',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    }
    expect(presetStillApplies(subtotal)).toBe(true)

    const broken = { ...subtotal, aggregate: 'list' as const, expand: 'down' as const }
    expect(presetStillApplies(broken)).toBe(false)
  })

  it('inferDropPreset / isExpansionBandRow 落格推断', () => {
    const groupAddr = { row: 1, col: 0 }
    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'

    const getBindingAt = (addr: CellAddress) => {
      if (addr.row === groupAddr.row && addr.col === groupAddr.col) return group
      return undefined
    }

    expect(isExpansionBandRow(1, getBindingAt)).toBe(true)
    expect(isExpansionBandRow(0, getBindingAt)).toBe(false)
    expect(inferDropPreset({ row: 2, col: 0 }, 'number', getBindingAt)).toBe('subtotal')
    expect(inferDropPreset({ row: 2, col: 0 }, 'string', getBindingAt)).toBe('detail')
  })

  it('inferDropPreset：数值字段落在横向展开带正右相邻列也推断为小计', () => {
    const colGroup = createReportBinding(ORDERS_DATASET, 'region')
    colGroup.aggregate = 'group'
    colGroup.expand = 'right'

    const getBindingAt = (addr: CellAddress) => {
      if (addr.row === 0 && addr.col === 1) return colGroup
      return undefined
    }

    expect(inferDropPreset({ row: 0, col: 2 }, 'number', getBindingAt)).toBe('subtotal')
    expect(inferDropPreset({ row: 0, col: 2 }, 'string', getBindingAt)).toBe('detail')
  })

  it('inferRowParentCandidate：同行向左优先分组头', () => {
    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    const detail = createReportBinding(ORDERS_DATASET, 'orderNo')

    const getBindingAt = (addr: CellAddress) => {
      if (addr.row === 1 && addr.col === 0) return group
      if (addr.row === 1 && addr.col === 1) return detail
      return undefined
    }

    expect(inferRowParentCandidate({ row: 1, col: 2 }, getBindingAt)).toEqual({ row: 1, col: 0 })
  })

  it('inferRowParentCandidate：下方跨列小计推到行分组头而不是同列 list', () => {
    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    const detail = createReportBinding(ORDERS_DATASET, 'amount')

    const getBindingAt = (addr: CellAddress) => {
      if (addr.row === 1 && addr.col === 0) return group
      if (addr.row === 1 && addr.col === 2) return detail
      return undefined
    }

    expect(
      inferRowParentCandidate({ row: 2, col: 2 }, getBindingAt, { preferGroup: true })
    ).toEqual({ row: 1, col: 0 })
    expect(inferParentsForPreset({ row: 2, col: 2 }, 'subtotal', getBindingAt)).toEqual({
      rowParent: { row: 1, col: 0 }
    })
  })

  it('inferColParentCandidate：右侧列小计同列向上推到列分组头', () => {
    const colGroup = createReportBinding(ORDERS_DATASET, 'region')
    colGroup.aggregate = 'group'
    colGroup.expand = 'right'
    const cross = createReportBinding(ORDERS_DATASET, 'amount')
    cross.preset = 'cross'
    cross.aggregate = 'sum'
    cross.expand = 'none'
    cross.colParent = { row: 0, col: 1 }

    const getBindingAt = (addr: CellAddress) => {
      if (addr.row === 0 && addr.col === 1) return colGroup
      if (addr.row === 1 && addr.col === 1) return cross
      return undefined
    }

    expect(
      inferColParentCandidate({ row: 2, col: 1 }, getBindingAt, { preferGroup: true })
    ).toEqual({ row: 0, col: 1 })
    expect(inferParentsForPreset({ row: 2, col: 1 }, 'subtotal', getBindingAt)).toEqual({
      colParent: { row: 0, col: 1 }
    })
  })

  it('formatCellAddress / parseCellAddress 支持多字母列互逆', () => {
    const single = { row: 2, col: 1 }
    expect(formatCellAddress(single)).toBe('B3')
    expect(parseCellAddress('B3')).toEqual(single)

    const wide = { row: 0, col: 26 }
    expect(formatCellAddress(wide)).toBe('AA1')
    expect(parseCellAddress('AA1')).toEqual(wide)

    const wider = { row: 99, col: 701 }
    expect(formatCellAddress(wider)).toBe('ZZ100')
    expect(parseCellAddress('ZZ100')).toEqual(wider)

    expect(parseCellAddress('bad')).toBeNull()
  })
})
