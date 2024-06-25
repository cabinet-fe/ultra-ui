import { debounce } from 'cat-kit/fe'
import { computed, shallowRef, watch, type ModelRef } from 'vue'

interface Options {
  model: ModelRef<string | undefined>
  props: {
    suggestions?: string[] | ((qs?: string) => Promise<string[]> | string[])
  }
}

export function useSuggestions(options: Options) {
  const { model, props } = options
  const remoteSuggestions = shallowRef<string[]>([])
  const filteredSuggestions = shallowRef<string[]>([])
  // 追加的建议
  const appendedSuggestions = shallowRef<string[]>([])

  const suggestions = computed(() => {
    const { suggestions } = props
    if (!suggestions) return appendedSuggestions.value

    if (typeof suggestions === 'function') {
      return remoteSuggestions.value.concat(appendedSuggestions.value)
    }

    return filteredSuggestions.value
  })

  // 缓存的建议
  const cachedSuggestion = computed(() => {
    if (!model.value) return undefined
    return suggestions.value.includes(model.value) ? undefined : model.value
  })

  watch(
    model,
    debounce(async v => {
      if (typeof props.suggestions === 'function') {
        const suggestions = await props.suggestions(v)
        remoteSuggestions.value = suggestions ?? []
      } else {
        if (!v) {
          filteredSuggestions.value = [
            ...(props.suggestions ?? []),
            ...appendedSuggestions.value
          ]
          return
        }
        filteredSuggestions.value = [
          ...(props.suggestions?.filter(item => item.includes(v)) ?? []),
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
