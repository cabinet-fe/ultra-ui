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
    queryString,
    debounce(async qs => {
      if (typeof props.options === 'function') {
        const options = await props.options(qs)
        remoteOptions.value = options
      } else {
        const { labelKey } = props
        filteredOptions.value =
          props.options?.filter(item =>
            item[labelKey].includes(queryString.value)
          ) ?? []
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
