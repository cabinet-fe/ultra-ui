import { debounce, o as chainObj } from '@cat-kit/core'
import { fieldKey } from '@veltra/utils'
import { computed, shallowRef, watch, type ShallowRef, type ComputedRef } from 'vue'

import type { SelectProps } from '../../types'

interface Options {
  props: SelectProps
}

interface UseOptionsReturned {
  /** 查询字符串 */
  queryString: ShallowRef<string>
  /** 远程搜索加载中 */
  loading: ShallowRef<boolean>
  /** 选项 */
  options: ComputedRef<Record<string, any>[]>
  /** 所有选项 */
  allOptions: ComputedRef<Record<string, any>[]>
  /** 将临时选项转换为创建的选项 */
  temOptionsToCreatedOptions: () => void
  /** 清空用户创建的选项 */
  clearCreatedOptions: () => void
}

// 允许创建的实现
// 1. 在过滤时将选项加入待选列表中
// 2. 如果选择了该临时选项，则取消该选项的临时标记并并入已创建列表
// 3. 多次创建累计保留，已创建项参与后续过滤匹配

export function useOptions(o: Options): UseOptionsReturned {
  const { props } = o

  /** 筛选 */
  const queryString = shallowRef('')

  const loading = shallowRef(false)
  /** 远程请求序号；响应返回时序号不一致说明已有更新的请求，结果作废 */
  let remoteSeq = 0

  const remoteOptions = shallowRef<Record<string, any>[]>([])
  const filteredOptions = shallowRef<Record<string, any>[]>([])
  // 临时选项
  const tempOptions = shallowRef<({ __isTemp: true } & Record<string, any>)[]>([])
  // 创建的选项
  const createdOptions = shallowRef<({ __isTemp: false } & Record<string, any>)[]>([])

  function getSourceOptions(propsOptions: SelectProps['options']) {
    if (typeof propsOptions === 'function') return remoteOptions.value
    return [...createdOptions.value, ...(propsOptions ?? [])]
  }

  /** 无查询时同步展示完整列表（含已创建项），避免选择后等高亮索引错位 */
  function resetToSourceOptions() {
    const sourceOptions = getSourceOptions(props.options)
    if (typeof props.options === 'function') {
      setTempOption('', remoteOptions.value)
      return
    }
    filteredOptions.value = sourceOptions
    tempOptions.value = []
  }

  function temOptionsToCreatedOptions() {
    if (!tempOptions.value.length) return

    createdOptions.value = [
      ...createdOptions.value,
      ...tempOptions.value.map((item) => {
        return { ...item, __isTemp: false as const }
      })
    ]
    // 立即清掉临时项并回到完整列表，不等待过滤防抖
    resetToSourceOptions()
  }

  function clearCreatedOptions() {
    createdOptions.value = []
    resetToSourceOptions()
  }

  const setTempOption = (qs: string, options?: Record<string, any>[]) => {
    if (!qs?.trim() || !props.creatable) {
      tempOptions.value = []
      return
    }
    const labelKey = fieldKey(props.labelKey, 'label')
    const valueKey = fieldKey(props.valueKey, 'value')
    const exactMatch = options
      ? options.some((option) => {
          return chainObj(option).get(labelKey) === qs
        })
      : false

    tempOptions.value = exactMatch ? [] : [{ [labelKey]: qs, [valueKey]: qs, __isTemp: true }]
  }

  const allOptions = computed(() => {
    const { options } = props
    if (typeof options === 'function') return remoteOptions.value
    return [...createdOptions.value, ...(options ?? [])]
  })

  /**
   * 展示的选项
   * @description 已创建选项并入过滤数据源参与匹配；临时选项（待创建）固定置顶
   */
  const options = computed(() => {
    const { options } = props

    if (typeof options === 'function') return remoteOptions.value

    return [...tempOptions.value, ...filteredOptions.value]
  })

  const applyLocalFilter = (qs: string, propsOptions: Record<string, any>[] | undefined) => {
    const labelKey = fieldKey(props.labelKey, 'label')
    const sourceOptions = [...createdOptions.value, ...(propsOptions ?? [])]

    if (!qs) {
      filteredOptions.value = sourceOptions
      setTempOption(qs, filteredOptions.value)
      return
    }

    const _filteredOptions = sourceOptions.filter((item) => {
      return chainObj(item).get(labelKey)?.includes(qs) ?? false
    })

    setTempOption(qs, _filteredOptions)
    filteredOptions.value = _filteredOptions
  }

  // 仅对「有查询词」的本地过滤做防抖；清空查询同步生效，避免选中后列表延迟重建
  const debouncedLocalFilter = debounce(
    (qs: string, propsOptions: Record<string, any>[] | undefined) => {
      // 防抖回调可能晚于清空查询到达，以当前 queryString 为准
      if (!queryString.value) {
        applyLocalFilter('', propsOptions)
        return
      }
      applyLocalFilter(qs, propsOptions)
    },
    200
  )

  const debouncedRemoteFilter = debounce(async (qs: string, propsOptions: Function) => {
    const seq = ++remoteSeq
    loading.value = true
    try {
      const options = await propsOptions(qs)
      // 响应到达时查询词可能已变化或已有更新的请求，过期结果直接丢弃
      if (seq !== remoteSeq || qs !== queryString.value) return
      remoteOptions.value = options ?? []
      setTempOption(qs, remoteOptions.value)
    } finally {
      if (seq === remoteSeq) loading.value = false
    }
  }, 200)

  watch(
    [queryString, () => props.options, createdOptions],
    ([qs, propsOptions]) => {
      if (typeof propsOptions === 'function') {
        debouncedRemoteFilter(qs, propsOptions)
        return
      }

      if (!qs) {
        applyLocalFilter('', propsOptions)
        return
      }

      debouncedLocalFilter(qs, propsOptions)
    },
    { immediate: true }
  )

  return {
    queryString,
    loading,
    options,
    allOptions,
    temOptionsToCreatedOptions,
    clearCreatedOptions
  }
}
