import { debounce } from 'cat-kit/fe'
import { computed, shallowRef, watch } from 'vue'

interface Options<O extends Record<string, any>> {
  props: {
    options?: O[] | ((qs: string) => Promise<O[]> | O[])
    labelKey: string
    valueKey: string
  }
}
export function useOptions<O extends Record<string, any>>(o: Options<O>) {
  const { props } = o

  /** 筛选 */
  const queryString = shallowRef('')

  const remoteOptions = shallowRef<O[]>([])
  const filteredOptions = shallowRef<O[]>([])

  /** 已过滤的选项 */
  const options = computed(() => {
    const { options } = props

    if (!options) return []

    if (typeof options === 'function') return remoteOptions.value

    return filteredOptions.value
  })

  watch(
    [queryString, () => props.options],
    debounce(async ([qs, propsOptions]) => {
      if (typeof propsOptions === 'function') {
        const options = await propsOptions(qs)
        remoteOptions.value = options
      } else {
        const { labelKey } = props

        if (!qs) {
          filteredOptions.value = propsOptions ?? []
          return
        }
        filteredOptions.value =
          propsOptions?.filter(item => item[labelKey].includes(qs)) ?? []
      }
    }, 200),
    {
      immediate: true
    }
  )

  return {
    queryString,
    options
  }
}
