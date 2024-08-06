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
        @keyup.enter="
          cachedSuggestion && handleSelectCachedOption(cachedSuggestion)
        "
      >
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <u-scroll tag="ul" :class="cls.e('options')" ref="scrollRef">
        <li
          v-if="cachedSuggestion"
          :class="[optionClass]"
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
          :class="[optionClass, bem.is('selected', option === model)]"
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

  <span v-else>{{ model || FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue'
import type {
  AutoCompleteEmits,
  AutoCompleteProps,
  _AutoCompleteExposed
} from '@ui/types/components/auto-complete'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll, type ScrollExposed } from '../scroll'
import { vRipple } from '@ui/directives'
import { UInput } from '../input'
import { useSuggestions } from './use-suggestions'
import { FORM_EMPTY_CONTENT } from '@ui/shared'

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

defineSlots<{
  default: (props: { option: string; index: number }) => any
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
const scrollRef = shallowRef<ScrollExposed>()

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    const li = scroll.contentRef!.querySelector(`li[data-key="${model.value}"]`)
    li?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})

const { suggestions, appendedSuggestions, cachedSuggestion } = useSuggestions({
  props,
  model
})

/** 选中选项 */
const handleSelect = (option: string) => {
  model.value = option
  dropdownRef.value?.close()
  saveCache()
}

function saveCache() {
  if (!model.value) return
  appendedSuggestions.value = [...appendedSuggestions.value, model.value]
}

const handleSelectCachedOption = (cachedOption: string) => {
  appendedSuggestions.value = [...appendedSuggestions.value, cachedOption]
  dropdownRef.value?.close()
}

const dropdownVisible = shallowRef(false)
</script>
