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
// 2. 如果选择了改临时选项，则取消该选项的临时标记
// 3. 如果第二次重新选择

export function useOptions(o: Options): UseOptionsReturned {
  const { props } = o

  /** 筛选 */
  const queryString = shallowRef('')

  const remoteOptions = shallowRef<Record<string, any>[]>([])
  const filteredOptions = shallowRef<Record<string, any>[]>([])
  // 临时选项
  const tempOptions = shallowRef<({ __isTemp: true } & Record<string, any>)[]>([])
  // 创建的选项
  const createdOptions = shallowRef<({ __isTemp: false } & Record<string, any>)[]>([])

  function temOptionsToCreatedOptions() {
    createdOptions.value = tempOptions.value.map((item) => {
      return { ...item, __isTemp: false }
    })
  }

  function clearCreatedOptions() {
    createdOptions.value = []
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

    if (!exactMatch) {
      tempOptions.value = [{ [labelKey]: qs, [valueKey]: qs, __isTemp: true }]
    }
  }

  const allOptions = computed(() => {
    const { options } = props
    if (typeof options === 'function') return remoteOptions.value
    return options ?? []
  })

  /** 展示的选项 */
  const options = computed(() => {
    const { options } = props

    if (typeof options === 'function') return remoteOptions.value

    const prependOptions = tempOptions.value?.length ? tempOptions.value : createdOptions.value

    if (!options) {
      return prependOptions
    }

    return [...prependOptions, ...filteredOptions.value]
  })

  // TODO: 如有性能问题可以考虑优化
  watch(
    [queryString, () => props.options],
    debounce(async ([qs, propsOptions]) => {
      if (typeof propsOptions === 'function') {
        const options = await propsOptions(qs)
        remoteOptions.value = options
        setTempOption(qs, options)
      } else {
        // 当选项不是函数时，可以创建选项
        const labelKey = fieldKey(props.labelKey, 'label')

        if (!qs) {
          filteredOptions.value = propsOptions ?? []
          setTempOption(qs, filteredOptions.value)
          return
        }

        const _filteredOptions =
          propsOptions?.filter((item) => {
            return chainObj(item).get(labelKey)?.includes(qs) ?? false
          }) ?? []

        setTempOption(qs, _filteredOptions)
        filteredOptions.value = _filteredOptions
      }
    }, 200),
    { immediate: true }
  )

  return { queryString, options, allOptions, temOptionsToCreatedOptions, clearCreatedOptions }
}
