import type { SheetSnapshot } from '@veltra/sheet-core'
import { computed, ref, shallowRef, watch, type ComputedRef, type Ref, type ShallowRef } from 'vue'

import type { ConnectorError } from '../../report/connector'
import { renderReport } from '../../report/render'
import {
  fetchTemplateRecords,
  resolveParamDefaults,
  resolveTemplateParams
} from '../../report/template'
import type { ParamValues, QueryParamDef } from '../../report/types'
import type { ReportViewerProps } from '../../types'

export interface UseReportViewerReturn {
  /** Filter Bar 参数（模板实际绑定的数据集的查询参数并集） */
  params: ComputedRef<QueryParamDef[]>
  /** 当前运行时参数值（初始为参数默认值） */
  values: Ref<ParamValues>
  /** 取数中 */
  loading: Ref<boolean>
  /** 最近一次取数的业务错误（可读提示；成功或重新取数时清空） */
  error: ShallowRef<ConnectorError | null>
  /** 最近一次成功展开渲染的 Filled Report 快照（组件壳据此替换网格内容） */
  filledSnapshot: ShallowRef<SheetSnapshot | null>
  /** 重新取数并展开渲染 */
  refresh: () => Promise<void>
  /** Filter Bar 改值：写入新参数值并重新取数 */
  setValues: (next: ParamValues) => void
}

/**
 * UReportViewer 的 headless 编排：参数提取 → 取数 → renderReport 展开。
 * 不持有 DOM / 网格引用；填充快照经 `filledSnapshot` 交给组件壳应用。
 */
export function useReportViewer(props: ReportViewerProps): UseReportViewerReturn {
  const loading = ref(false)
  const error = shallowRef<ConnectorError | null>(null)
  const filledSnapshot = shallowRef<SheetSnapshot | null>(null)

  const params = computed(() => resolveTemplateParams(props.template))
  // 初始值由下方 immediate watch 播种（参数默认值）
  const values = shallowRef<ParamValues>({})

  // 并发守卫：只应用最后一次取数结果（Filter Bar 连续改值时前序结果作废）
  let fetchSeq = 0

  async function refresh(): Promise<void> {
    const current = ++fetchSeq
    const template = props.template
    loading.value = true
    error.value = null
    const result = await fetchTemplateRecords(props.connector, template, values.value)
    if (current !== fetchSeq) return
    loading.value = false
    if (!result.ok) {
      error.value = result.error
      return
    }
    filledSnapshot.value = renderReport(template, result.data)
  }

  function setValues(next: ParamValues): void {
    values.value = next
    void refresh()
  }

  // 模板更换：清空上一模板的填充结果，参数值重置为新模板默认值并重新取数
  watch(
    () => props.template,
    () => {
      filledSnapshot.value = null
      values.value = resolveParamDefaults(params.value)
      void refresh()
    },
    { immediate: true }
  )

  return { params, values, loading, error, filledSnapshot, refresh, setValues }
}
