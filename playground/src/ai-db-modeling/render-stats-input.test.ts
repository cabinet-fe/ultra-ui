import { describe, expect, it } from 'vite-plus/test'

import { validateRenderStatsInput } from './render-stats-input'

/** 合法载荷：bar 多系列 + line + pie（title 可选省略） */
const validInput = {
  summary: '按会员等级统计订单金额',
  charts: [
    {
      type: 'bar',
      title: '各等级订单金额',
      data: {
        labels: ['普通', '黄金'],
        series: [
          { name: '总金额', values: [120, 480] },
          { name: '订单数', values: [3, 4] }
        ]
      }
    },
    {
      type: 'line',
      data: { labels: ['1月', '2月'], series: [{ name: '流水', values: [10, 20] }] }
    },
    { type: 'pie', data: { labels: ['普通', '黄金'], series: [{ name: '占比', values: [7, 3] }] } }
  ]
}

/** 在合法载荷上做局部覆盖（含非法值注入），返回深拷贝后的入参 */
function patchInput(patch: (input: any) => void): typeof validInput {
  const input = JSON.parse(JSON.stringify(validInput)) as typeof validInput
  patch(input)
  return input
}

function validateError(input: unknown): string {
  const result = validateRenderStatsInput(input)
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('unreachable')
  return result.error
}

describe('validateRenderStatsInput', () => {
  it('合法载荷通过：多类型图表、多系列、可选 title，value 原样返回', () => {
    const result = validateRenderStatsInput(validInput)
    expect(result).toEqual({ ok: true, value: validInput })
  })

  it('非对象入参返回中文错误', () => {
    expect(validateError(null)).toContain('JSON 对象')
    expect(validateError('x')).toContain('JSON 对象')
  })

  it('summary 缺失或空串返回中文错误', () => {
    const withoutSummary = { ...validInput }
    delete withoutSummary.summary
    expect(validateError(withoutSummary)).toBe('summary 必须是非空字符串')
    expect(validateError(patchInput((input) => (input.summary = '')))).toBe(
      'summary 必须是非空字符串'
    )
    expect(validateError(patchInput((input) => (input.summary = '   ')))).toBe(
      'summary 必须是非空字符串'
    )
  })

  it('入参多出 rawData 键不报错且被忽略（历史会话旧入参兼容）', () => {
    const input = patchInput((draft) => {
      draft.rawData = [{ 会员: '张三', 订单数: 3 }]
    })
    expect(validateRenderStatsInput(input)).toEqual({ ok: true, value: input })
  })

  it('charts 缺失或非数组返回中文错误', () => {
    const withoutCharts = { ...validInput }
    delete withoutCharts.charts
    expect(validateError(withoutCharts)).toBe('charts 必须是数组')
    expect(validateError(patchInput((input) => (input.charts = null)))).toBe('charts 必须是数组')
  })

  it('chart type 枚举外返回中文错误', () => {
    expect(validateError(patchInput((input) => (input.charts[0].type = 'scatter')))).toBe(
      'charts[0].type 必须是 bar / line / pie 之一'
    )
  })

  it('chart title 非字符串返回中文错误', () => {
    expect(validateError(patchInput((input) => (input.charts[0].title = 3)))).toBe(
      'charts[0].title 必须是字符串'
    )
  })

  it('labels 非字符串数组返回中文错误', () => {
    expect(validateError(patchInput((input) => (input.charts[0].data.labels = [1, 2])))).toBe(
      'charts[0].data.labels 必须是字符串数组'
    )
  })

  it('series 空数组返回中文错误', () => {
    expect(validateError(patchInput((input) => (input.charts[0].data.series = [])))).toBe(
      'charts[0].data.series 必须是非空数组'
    )
  })

  it('系列名非字符串返回中文错误', () => {
    const input = patchInput((draft) => (draft.charts[0].data.series[0].name = 1))
    expect(validateError(input)).toBe('charts[0].data.series[0].name 必须是字符串')
  })

  it('values 非数字数组返回中文错误', () => {
    const input = patchInput((draft) => (draft.charts[0].data.series[0].values = [1, 'x']))
    expect(validateError(input)).toBe('charts[0].data.series[0].values 必须是数字数组')
  })

  it('values 与 labels 不等长返回中文错误（带两长度）', () => {
    const input = patchInput((draft) => (draft.charts[0].data.series[0].values = [120]))
    expect(validateError(input)).toBe(
      'charts[0].data.series[0].values 长度必须与 charts[0].data.labels 一致（1 ≠ 2）'
    )
  })

  it('第二个图表的非法项错误定位到对应下标', () => {
    const input = patchInput((draft) => (draft.charts[1].data.series[0].values = []))
    expect(validateError(input)).toBe(
      'charts[1].data.series[0].values 长度必须与 charts[1].data.labels 一致（0 ≠ 2）'
    )
  })
})
