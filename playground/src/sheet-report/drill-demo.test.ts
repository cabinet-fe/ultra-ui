import type { DataConnection, ReportBinding } from '@veltra/sheet'
import { describe, expect, it } from 'vitest'

import {
  DRILL_DEMO_CUSTOMER_NAME,
  DRILL_DEMO_DETAIL_NAME,
  DRILL_DEMO_SUMMARY_NAME,
  buildCustomerOrderTemplate,
  buildOrderDetailTemplate,
  buildRegionSummaryTemplate,
  mergeDemoDatasets,
  toDrillTemplates
} from './drill-demo'
import type { WorkspaceData } from './report-api'

const PG: DataConnection = {
  id: 'pg-1',
  label: 'demo',
  type: 'postgresql',
  host: '127.0.0.1',
  port: 5432,
  database: 'demo',
  username: 'u',
  password: ''
}

function bindingAt(
  template: ReturnType<typeof buildRegionSummaryTemplate>,
  row: number,
  col: number
): ReportBinding {
  const meta = template.meta?.find((item) => item.row === row && item.col === col)
  return meta!.payload as ReportBinding
}

describe('sheet-report 下钻演示模板', () => {
  it('地区汇总：地区格 switch、总额格 dialog，均指向订单明细 ref', () => {
    const template = buildRegionSummaryTemplate(PG, { detailRef: 'tpl-detail' })
    expect(template.datasets?.[0]?.sql).toMatch(/GROUP BY region/)
    expect(bindingAt(template, 1, 0).drill).toEqual({
      target: 'tpl-detail',
      mapping: { region: 'p_region' },
      openMode: 'switch'
    })
    expect(bindingAt(template, 1, 1).drill).toEqual({
      target: 'tpl-detail',
      mapping: { region: 'p_region' },
      openMode: 'dialog'
    })
  })

  it('订单明细：客户列 switch 下钻到客户订单，Filter Bar 参数为 p_region', () => {
    const template = buildOrderDetailTemplate(PG, { customerRef: 'tpl-customer' })
    expect(bindingAt(template, 1, 0).drill).toEqual({
      target: 'tpl-customer',
      mapping: { customer: 'p_customer' },
      openMode: 'switch'
    })
    expect(bindingAt(template, 1, 1).drill).toBeUndefined()
    expect(template.datasets?.[0]?.sql).toContain('${p_region}')
  })

  it('客户订单：无下钻，参数为 p_customer', () => {
    const template = buildCustomerOrderTemplate(PG)
    expect(bindingAt(template, 1, 0).drill).toBeUndefined()
    expect(template.datasets?.[0]?.sql).toContain('${p_customer}')
  })

  it('mergeDemoDatasets 按 id 幂等追加', () => {
    const empty: WorkspaceData = { connections: [PG], datasets: [] }
    const first = mergeDemoDatasets(empty, PG.id)
    expect(first.changed).toBe(true)
    expect(first.workspace.datasets).toHaveLength(3)
    const second = mergeDemoDatasets(first.workspace, PG.id)
    expect(second.changed).toBe(false)
    expect(second.workspace.datasets).toHaveLength(3)
  })

  it('toDrillTemplates 把模板库摘要映射为设计器列表项', () => {
    expect(toDrillTemplates([{ id: 'a', name: '主表', createdAt: '', updatedAt: '' }])).toEqual([
      { ref: 'a', label: '主表' }
    ])
  })

  it('演示模板名称稳定，供按名幂等创建', () => {
    expect(DRILL_DEMO_SUMMARY_NAME).toBe('【演示】地区汇总')
    expect(DRILL_DEMO_DETAIL_NAME).toBe('【演示】订单明细')
    expect(DRILL_DEMO_CUSTOMER_NAME).toBe('【演示】客户订单')
  })
})
