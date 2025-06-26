import { debounce } from 'cat-kit/fe'
import {
  computed,
  type ComputedRef,
  type ShallowRef,
  shallowRef,
  watch,
  type ModelRef
} from 'vue'

interface Options {
  model: ModelRef<string | undefined>
  props: {
    suggestions?: string[] | ((qs?: string) => Promise<string[]> | string[])
  }
}

interface UseSuggestionsReturned {
  suggestions: ComputedRef<string[]>
  cachedSuggestion: ComputedRef<string | undefined>
  appendedSuggestions: ShallowRef<string[]>
}

export function useSuggestions(options: Options): UseSuggestionsReturned {
  const { model, props } = options

  /**
   * 动态的建议
   */
  const dynamicSuggestions = shallowRef<string[]>([])
  /** 过滤后的建议 */
  const filteredSuggestions = shallowRef<string[]>([])

  const appendedSuggestions = shallowRef<string[]>([])

  const suggestions = computed(() => {
    const { suggestions } = props
    if (!suggestions) return appendedSuggestions.value

    if (typeof suggestions === 'function') {
      return dynamicSuggestions.value.concat(appendedSuggestions.value)
    }

    return filteredSuggestions.value
  })

  // 缓存的建议
  const cachedSuggestion = computed(() => {
    if (!model.value) return undefined
    return suggestions.value.includes(model.value) ? undefined : model.value
  })

  watch(
    [model, () => props.suggestions],
    debounce(async ([v, propsSuggestions]) => {
      if (typeof propsSuggestions === 'function') {
        const suggestions = await propsSuggestions(v)
        dynamicSuggestions.value = suggestions ?? []
      } else {
        if (!v) {
          filteredSuggestions.value = [
            ...(propsSuggestions ?? []),
            ...appendedSuggestions.value
          ]
          return
        }

        filteredSuggestions.value = [
          ...(propsSuggestions?.filter(item => item.includes(v)) ?? []),
          ...appendedSuggestions.value.filter(item => item.includes(v))
        ]
      }
    }, 200),
    {
      immediate: true
    }
  )

  return {
    suggestions,
    cachedSuggestion,
    appendedSuggestions
  }
}
