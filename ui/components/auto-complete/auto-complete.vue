<template>
  <u-dropdown
    v-if="!readonly"
    trigger="click"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    :disabled="disabled"
  >
    <!-- 触发 -->
    <template #trigger>
      <!-- 单选 -->
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        v-model="model"
        @keydown="handleInputKeydown"
      >
        <template #suffix v-if="slots.suffix">
          <slot name="suffix" />
        </template>

        <template #prefix v-if="slots.prefix">
          <slot name="prefix" />
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <u-scroll tag="ul" :class="cls.e('options')" ref="scrollRef">
        <li
          v-if="cachedSuggestion"
          :class="[optionClass, bem.is('active', isCachedActive)]"
          @click="handleSelectCachedOption(cachedSuggestion)"
          v-ripple="cls.e('ripple')"
          :data-key="cachedSuggestion"
          :key="cachedSuggestion"
        >
          <slot v-bind="{ option: cachedSuggestion, index: -1 }">
            {{ cachedSuggestion }}
          </slot>
        </li>

        <li
          v-for="(option, index) of suggestions"
          :class="[
            optionClass,
            bem.is('selected', option === model),
            bem.is('active', isActiveOption(index))
          ]"
          @click="handleSelect(option)"
          v-ripple="cls.e('ripple')"
          :data-key="option"
          :key="option"
        >
          <slot v-bind="{ option, index }">
            {{ option }}
          </slot>
        </li>
      </u-scroll>
    </template>
  </u-dropdown>

  <template v-else>
    {{ model || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { computed, shallowRef, watch } from 'vue'
import type {
  AutoCompleteEmits,
  AutoCompleteProps,
  _AutoCompleteExposed
} from '@ui/types'
import { bem, scrollIntoContainerView } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDropdown } from '../dropdown'
import { UScroll } from '../scroll'
import { vRipple } from '@ui/directives'
import { UInput } from '../input'
import { useSuggestions } from './use-suggestions'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { DropdownExposed, ScrollExposed } from '@ui/types'
import { useKeyboard } from './use-keyboard'

defineOptions({
  name: 'AutoComplete',
  inheritAttrs: false
})

const props = withDefaults(defineProps<AutoCompleteProps>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<AutoCompleteEmits>()

const slots = defineSlots<{
  default?: (props: { option: string; index: number }) => any
  suffix?: () => any
  prefix?: () => any
}>()

// 当前输入框的值
const model = defineModel<string>()

const cls = bem('auto-complete')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const dropdownRef = shallowRef<DropdownExposed>()
const dropdownVisible = shallowRef(false)
const scrollRef = shallowRef<ScrollExposed>()

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    const li = scroll.contentRef!.querySelector(
      `li[data-key="${model.value}"]`
    ) as HTMLElement
    li && scrollIntoContainerView(li, scroll.containerRef ?? null)
  }
})

const { suggestions, appendedSuggestions, cachedSuggestion } = useSuggestions({
  props,
  model
})

const keyboardOptions = computed(() => {
  const currentSuggestions = suggestions.value
  return cachedSuggestion.value
    ? [cachedSuggestion.value, ...currentSuggestions]
    : currentSuggestions
})

const { point, handleKeydown } = useKeyboard({
  options: keyboardOptions,
  dropdownVisible,
  getDefaultIndex: options => {
    if (!options.length) return -1
    if (model.value) {
      const matchIndex = options.indexOf(model.value)
      if (matchIndex > -1) return matchIndex
    }
    return 0
  },
  onSelect: (option, index) => {
    if (cachedSuggestion.value && index === 0) {
      handleSelectCachedOption(option)
      return
    }
    handleSelect(option)
  }
})

const isCachedActive = computed(
  () => !!cachedSuggestion.value && point.value === 0
)

const isActiveOption = (index: number) => {
  const offset = cachedSuggestion.value ? 1 : 0
  return point.value === index + offset
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (
    !dropdownVisible.value &&
    event.key === 'Enter' &&
    cachedSuggestion.value
  ) {
    event.preventDefault()
    event.stopPropagation()
    handleSelectCachedOption(cachedSuggestion.value)
    return
  }
  handleKeydown(event)
}

watch([point, keyboardOptions], ([currentPoint, options]) => {
  if (!scrollRef.value || currentPoint < 0) return
  const currentOption = options[currentPoint]
  if (!currentOption) return
  const target = scrollRef.value.contentRef?.querySelector(
    `li[data-key="${currentOption}"]`
  ) as HTMLElement | null
  if (target) {
    scrollIntoContainerView(target, scrollRef.value.containerRef ?? null)
  }
})

/** 选中选项 */
const handleSelect = (option: string) => {
  model.value = option
  dropdownRef.value?.close()
  saveCache()
  emit('select', option)
}

function saveCache() {
  if (!model.value) return
  appendedSuggestions.value = [...appendedSuggestions.value, model.value]
}

const handleSelectCachedOption = (cachedOption: string) => {
  appendedSuggestions.value = [...appendedSuggestions.value, cachedOption]
  dropdownRef.value?.close()
}
</script>
