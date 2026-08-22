import type { ReportTemplate } from './template'
import type { ParamValues, ReportDrillConfig } from './types'

/**
 * 按下钻映射从该格对应记录取值，生成详情报 Filter Bar 参数值。
 * 记录缺字段（值为 `undefined`）时跳过对应参数，由详情报回退默认值；空映射返回空参数。
 */
export function resolveDrillParams(
  config: ReportDrillConfig,
  record: Record<string, unknown>
): ParamValues {
  const values: ParamValues = {}
  for (const [field, paramId] of Object.entries(config.mapping)) {
    const value = record[field]
    if (value === undefined) continue
    values[paramId] = value
  }
  return values
}

/** 下钻栈层：一张报表模板 + 当时 Filter Bar 参数值（回退时据此恢复并重新取数） */
export interface DrillStackLayer {
  template: ReportTemplate
  params: ParamValues
}

/**
 * 下钻栈：自根（初始报表）到顶的层序列，至少一层。
 * 只经下方纯函数做不可变更新（返回新栈），便于组件层直接挂响应式。
 */
export type DrillStack = DrillStackLayer[]

/** 以初始报表为根层创建下钻栈 */
export function createDrillStack(root: DrillStackLayer): DrillStack {
  return [{ template: root.template, params: { ...root.params } }]
}

/**
 * 压入详情报新层并使其成为当前层；`currentParams` 把当前层参数定格为离开时的值
 * （缺省保留原值）。指向自身或成环不做检测，照常压栈，靠 pop 逐级退出。
 */
export function pushDrillLayer(
  stack: DrillStack,
  next: DrillStackLayer,
  currentParams?: ParamValues
): DrillStack {
  const top = stack[stack.length - 1]!
  const layers = currentParams
    ? [...stack.slice(0, -1), { template: top.template, params: { ...currentParams } }]
    : [...stack]
  layers.push({ template: next.template, params: { ...next.params } })
  return layers
}

/** 弹出当前层返回上一层；仅剩根层时原样返回（查看器始终保留一张报表） */
export function popDrillLayer(stack: DrillStack): DrillStack {
  if (stack.length <= 1) return stack
  return stack.slice(0, -1)
}

/** 当前层（栈顶） */
export function currentDrillLayer(stack: DrillStack): DrillStackLayer {
  return stack[stack.length - 1]!
}
