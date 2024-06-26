import { computed, shallowRef } from "vue"

interface Options<O extends Record<string, any>> {
  props: {
    options?: O[]
    labelKey?: string
    valueKey?: string
  }
}

export function useOptions<O extends Record<string, any>>(o: Options<O>) {
  const { props } = o

  const filteredOptions = shallowRef<O[]>([])

  const options = computed(() => {
    const { options } = props

    if (!options) return []

    return filteredOptions.value
  })

  return {
    options
  }
}
