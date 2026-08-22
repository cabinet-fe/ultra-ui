import type { CellAddress, SheetSnapshot } from '@veltra/sheet-core'
import { cellKey } from '@veltra/sheet-core'
import { computed, ref, shallowRef, watch, type ComputedRef, type Ref, type ShallowRef } from 'vue'

import type { ConnectorError } from '../../report/connector'
import {
  buildDrillHitMap,
  createDrillStack,
  currentDrillLayer,
  popDrillLayer,
  pushDrillLayer,
  resolveDrillParams,
  type DrillHit,
  type DrillStack
} from '../../report/drill'
import type { ReportColWidthEntry } from '../../report/export-xlsx'
import { renderReport, resolveFilledColWidths } from '../../report/render'
import {
  fetchTemplateRecords,
  resolveParamDefaults,
  resolveTemplateParams,
  type ReportTemplate
} from '../../report/template'
import type { ParamValues, QueryParamDef, ReportDrillConfig } from '../../report/types'
import type { ReportViewerProps } from '../../types'

export interface UseReportViewerReturn {
  /** Filter Bar 参数（当前层模板实际绑定的数据集的查询参数并集） */
  params: ComputedRef<QueryParamDef[]>
  /** 当前运行时参数值（初始为参数默认值；下钻时写入映射值） */
  values: Ref<ParamValues>
  /** 取数中 */
  loading: Ref<boolean>
  /** 最近一次取数的业务错误或下钻解析错误（可读提示；成功或重新取数时清空） */
  error: ShallowRef<ConnectorError | null>
  /** 最近一次成功展开渲染的 Filled Report 快照（组件壳据此替换网格内容） */
  filledSnapshot: ShallowRef<SheetSnapshot | null>
  /** 展开后物理列宽（由模板 colWidths 映射；无模板列宽时为 undefined） */
  filledColWidths: ShallowRef<ReadonlyArray<ReportColWidthEntry> | undefined>
  /** 当前展示模板：下钻栈顶；未下钻时为 props.template */
  currentTemplate: ComputedRef<ReportTemplate>
  /** 下钻栈深（0 = 根层，未下钻） */
  drillDepth: ComputedRef<number>
  /** 可回退（栈深 > 0） */
  canDrillBack: ComputedRef<boolean>
  /** 物理格下钻命中查询（无命中返回 null）；供组件壳点击 / 悬停判定 */
  resolveDrillHit: (addr: CellAddress) => DrillHit | null
  /**
   * 解析下钻目标：宿主契约取模板 + 默认值叠加映射参数。
   * 失败设可读错误、返回 null（栈不变）。成功时清除先前的下钻解析错误。
   */
  resolveDrillTarget: (
    config: ReportDrillConfig,
    record: Record<string, unknown>
  ) => Promise<{ template: ReportTemplate; params: ParamValues } | null>
  /**
   * 下钻进入（openMode 'switch'）：解析目标模板 → 映射参数带入 Filter Bar → 压栈切换并取数。
   * 解析失败设可读错误提示、停留当前报、栈不变。
   */
  drillInto: (config: ReportDrillConfig, record: Record<string, unknown>) => Promise<void>
  /** 回退上一层：恢复该层模板与当时 Filter Bar 参数并重新取数渲染 */
  drillBack: () => Promise<void>
  /** 重新取数并展开渲染 */
  refresh: () => Promise<void>
  /** Filter Bar 改值：写入新参数值并重新取数 */
  setValues: (next: ParamValues) => void
}

/**
 * UReportViewer 的 headless 编排：参数提取 → 取数 → renderReport 展开。
 * 不持有 DOM / 网格引用；填充快照经 `filledSnapshot` 交给组件壳应用。
 * 下钻：openMode 'switch' 栈式切换当前层；'dialog' 由组件壳解析目标后嵌套独立查看器。
 * 导出 / 打印始终作用于当前可见层。
 */
export function useReportViewer(props: ReportViewerProps): UseReportViewerReturn {
  const loading = ref(false)
  const error = shallowRef<ConnectorError | null>(null)
  const filledSnapshot = shallowRef<SheetSnapshot | null>(null)
  const filledColWidths = shallowRef<ReadonlyArray<ReportColWidthEntry> | undefined>(undefined)

  // 下钻栈：null = 未下钻（当前层即 props.template）；命中索引随每次成功取数重建
  const drillStack = shallowRef<DrillStack | null>(null)
  const drillHits = shallowRef<Map<number, DrillHit>>(new Map())

  const currentTemplate = computed(() => {
    const stack = drillStack.value
    return stack ? currentDrillLayer(stack).template : props.template
  })
  const drillDepth = computed(() => (drillStack.value?.length ?? 1) - 1)
  const canDrillBack = computed(() => drillDepth.value > 0)

  const params = computed(() => resolveTemplateParams(currentTemplate.value))
  // 初始值由下方 immediate watch 播种（参数默认值）
  const values = shallowRef<ParamValues>({})

  // 并发守卫：只应用最后一次取数结果（Filter Bar 连续改值时前序结果作废）
  let fetchSeq = 0

  async function refresh(): Promise<void> {
    const current = ++fetchSeq
    const template = currentTemplate.value
    loading.value = true
    error.value = null
    const result = await fetchTemplateRecords(props.connector, template, values.value)
    if (current !== fetchSeq) return
    loading.value = false
    if (!result.ok) {
      error.value = result.error
      filledColWidths.value = undefined
      return
    }
    filledSnapshot.value = renderReport(template, result.data)
    filledColWidths.value = template.colWidths?.length
      ? resolveFilledColWidths(template, result.data, template.colWidths)
      : undefined
    drillHits.value = props.resolveTemplate ? buildDrillHitMap(template, result.data) : new Map()
  }

  /** 切层共有收尾：清填充结果与命中索引，写入新层参数并重新取数 */
  function transitionTo(layerParams: ParamValues): Promise<void> {
    filledSnapshot.value = null
    filledColWidths.value = undefined
    drillHits.value = new Map()
    values.value = layerParams
    return refresh()
  }

  async function resolveDrillTarget(
    config: ReportDrillConfig,
    record: Record<string, unknown>
  ): Promise<{ template: ReportTemplate; params: ParamValues } | null> {
    const resolve = props.resolveTemplate
    if (!resolve) return null

    let target: ReportTemplate | null | undefined
    try {
      target = await resolve(config.target)
    } catch (err) {
      error.value = {
        code: 'DRILL_RESOLVE_FAILED',
        message: err instanceof Error ? err.message : String(err)
      }
      return null
    }
    if (!target) {
      error.value = {
        code: 'DRILL_RESOLVE_FAILED',
        message: `下钻目标模板解析失败：${config.target}`
      }
      return null
    }

    error.value = null
    return {
      template: target,
      params: {
        ...resolveParamDefaults(resolveTemplateParams(target)),
        ...resolveDrillParams(config, record)
      }
    }
  }

  async function drillInto(
    config: ReportDrillConfig,
    record: Record<string, unknown>
  ): Promise<void> {
    const next = await resolveDrillTarget(config, record)
    if (!next) return
    const base =
      drillStack.value ?? createDrillStack({ template: props.template, params: values.value })
    drillStack.value = pushDrillLayer(
      base,
      { template: next.template, params: next.params },
      values.value
    )
    await transitionTo(next.params)
  }

  async function drillBack(): Promise<void> {
    const stack = drillStack.value
    if (!stack || stack.length <= 1) return
    const next = popDrillLayer(stack)
    drillStack.value = next
    await transitionTo({ ...currentDrillLayer(next).params })
  }

  function resolveDrillHit(addr: CellAddress): DrillHit | null {
    return drillHits.value.get(cellKey(addr)) ?? null
  }

  function setValues(next: ParamValues): void {
    values.value = next
    void refresh()
  }

  // 宿主更换根模板：下钻栈作废；Filter Bar 播种为默认值叠加 initialValues
  watch(
    () => props.template,
    () => {
      drillStack.value = null
      drillHits.value = new Map()
      filledSnapshot.value = null
      filledColWidths.value = undefined
      values.value = { ...resolveParamDefaults(params.value), ...props.initialValues }
      void refresh()
    },
    { immediate: true }
  )

  return {
    params,
    values,
    loading,
    error,
    filledSnapshot,
    filledColWidths,
    currentTemplate,
    drillDepth,
    canDrillBack,
    resolveDrillHit,
    resolveDrillTarget,
    drillInto,
    drillBack,
    refresh,
    setValues
  }
}
