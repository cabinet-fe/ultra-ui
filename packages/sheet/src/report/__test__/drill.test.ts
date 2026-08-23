import { Sheet, cellKey } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE } from '../binding'
import {
  buildDrillHitMap,
  createDrillStack,
  currentDrillLayer,
  popDrillLayer,
  pushDrillLayer,
  resolveDrillParams
} from '../drill'
import { createReportTemplate, type ReportTemplate } from '../template'
import type { ReportBinding, ReportDrillConfig } from '../types'

// ---- 内联 fixtures ----

/** 最小 Report Template：下钻栈只关心引用与参数，不消费快照内容 */
function makeTemplate(rows: number): ReportTemplate {
  return {
    version: 1,
    cells: [],
    styles: [],
    merges: [],
    frozen: { rows: 0, cols: 0 },
    rows,
    cols: 0
  }
}

const TPL_A = makeTemplate(10)
const TPL_B = makeTemplate(20)
const TPL_C = makeTemplate(30)

const DRILL: ReportDrillConfig = {
  target: 'tpl-detail',
  mapping: { region: 'p_region', amount: 'p_amount' },
  openMode: 'switch'
}

describe('resolveDrillParams', () => {
  it('按映射从记录取值为详情报参数', () => {
    const values = resolveDrillParams(DRILL, { region: '华东', amount: 100 })
    expect(values).toEqual({ p_region: '华东', p_amount: 100 })
  })

  it('记录缺字段时跳过对应参数，null 值保留', () => {
    const values = resolveDrillParams(DRILL, { region: '华东', amount: null })
    expect(values).toEqual({ p_region: '华东', p_amount: null })
    expect(
      'p_missing' in resolveDrillParams({ ...DRILL, mapping: { missing: 'p_missing' } }, {})
    ).toBe(false)
  })

  it('空映射返回空参数', () => {
    expect(resolveDrillParams({ ...DRILL, mapping: {} }, { region: '华东' })).toEqual({})
  })
})

describe('下钻栈', () => {
  it('根层即当前层', () => {
    const stack = createDrillStack({ template: TPL_A, params: { p: 'a0' } })
    expect(stack).toHaveLength(1)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'a0' } })
  })

  it('push 后当前层为新层，前层参数定格为离开时的值', () => {
    const stack = createDrillStack({ template: TPL_A, params: { p: 'a0' } })
    const next = pushDrillLayer(stack, { template: TPL_B, params: { p: 'b1' } }, { p: 'a1' })
    expect(next).toHaveLength(2)
    expect(currentDrillLayer(next)).toEqual({ template: TPL_B, params: { p: 'b1' } })
    expect(next[0]).toEqual({ template: TPL_A, params: { p: 'a1' } })
    // 不可变更新：原栈不受影响
    expect(stack).toHaveLength(1)
  })

  it('push 缺省 currentParams 时保留前层原参数', () => {
    const stack = createDrillStack({ template: TPL_A, params: { p: 'a0' } })
    const next = pushDrillLayer(stack, { template: TPL_B, params: {} })
    expect(next[0]).toEqual({ template: TPL_A, params: { p: 'a0' } })
  })

  it('pop 逐级回退并保留各层当时参数', () => {
    let stack = createDrillStack({ template: TPL_A, params: { p: 'a0' } })
    stack = pushDrillLayer(stack, { template: TPL_B, params: { p: 'b1' } }, { p: 'a1' })
    stack = pushDrillLayer(stack, { template: TPL_C, params: { p: 'c1' } }, { p: 'b2' })

    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_B, params: { p: 'b2' } })
    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'a1' } })
  })

  it('仅剩根层时 pop 原样返回', () => {
    const stack = createDrillStack({ template: TPL_A, params: {} })
    expect(popDrillLayer(stack)).toBe(stack)
  })

  it('指向自身照常压栈，靠 pop 逐级退出', () => {
    let stack = createDrillStack({ template: TPL_A, params: { p: 'a0' } })
    stack = pushDrillLayer(stack, { template: TPL_A, params: { p: 'a1' } })
    stack = pushDrillLayer(stack, { template: TPL_A, params: { p: 'a2' } })
    expect(stack).toHaveLength(3)

    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'a1' } })
    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'a0' } })
  })

  it('成环照常压栈，回退沿压栈路径逐级退出', () => {
    let stack = createDrillStack({ template: TPL_A, params: { p: 'root' } })
    stack = pushDrillLayer(stack, { template: TPL_B, params: { p: 'b1' } })
    stack = pushDrillLayer(stack, { template: TPL_A, params: { p: 'a-from-b' } })
    stack = pushDrillLayer(stack, { template: TPL_B, params: { p: 'b2' } })
    expect(stack.map((layer) => layer.template)).toEqual([TPL_A, TPL_B, TPL_A, TPL_B])

    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'a-from-b' } })
    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_B, params: { p: 'b1' } })
    stack = popDrillLayer(stack)
    expect(currentDrillLayer(stack)).toEqual({ template: TPL_A, params: { p: 'root' } })
  })
})

describe('buildDrillHitMap 与上下文解析', () => {
  it('分组格与汇总聚合格均生成正确命中上下文（含汇总格自身聚合值）', () => {
    const sheet = new Sheet()
    sheet.setCellMeta({ row: 0, col: 0 }, REPORT_META_NAMESPACE, {
      dataset: 'ds',
      field: 'region',
      aggregate: 'group',
      expand: 'down',
      drill: { target: 't2', mapping: { region: 'p_region' }, openMode: 'switch' }
    })
    sheet.setCellMeta({ row: 0, col: 1 }, REPORT_META_NAMESPACE, {
      dataset: 'ds',
      field: 'amount',
      aggregate: 'sum',
      expand: 'none',
      rowParent: { row: 0, col: 0 },
      drill: {
        target: 't2',
        mapping: { region: 'p_region', amount: 'p_amount' },
        openMode: 'dialog'
      }
    })

    const template = sheet.snapshot()
    const data = {
      ds: [
        { region: '华东', amount: 100 },
        { region: '华东', amount: 200 },
        { region: '华南', amount: 50 }
      ]
    }

    const hitMap = buildDrillHitMap(template, data)
    // 华东分组格 (0,0)
    const hitGroup0 = hitMap.get(cellKey({ row: 0, col: 0 }))
    expect(hitGroup0?.record).toEqual({ region: '华东' })

    // 华东汇总格 (0,1) 拥有祖先分组 region 与自身的求和计算值 300
    const hitSum0 = hitMap.get(cellKey({ row: 0, col: 1 }))
    expect(hitSum0?.record).toEqual({ region: '华东', amount: 300 })
    expect(resolveDrillParams(hitSum0!.config, hitSum0!.record)).toEqual({
      p_region: '华东',
      p_amount: 300
    })

    // 华南汇总格 (1,1)
    const hitSum1 = hitMap.get(cellKey({ row: 1, col: 1 }))
    expect(hitSum1?.record).toEqual({ region: '华南', amount: 50 })
    expect(resolveDrillParams(hitSum1!.config, hitSum1!.record)).toEqual({
      p_region: '华南',
      p_amount: 50
    })
  })
})

describe('旧绑定兼容', () => {
  it('无 drill 字段的旧绑定序列化往返后不出现 drill 键', () => {
    const binding: ReportBinding = {
      dataset: 'orders',
      field: 'region',
      expand: 'down',
      aggregate: 'list'
    }
    const restored = JSON.parse(JSON.stringify(binding)) as ReportBinding
    expect('drill' in restored).toBe(false)
    expect(restored.drill).toBeUndefined()
  })
})
