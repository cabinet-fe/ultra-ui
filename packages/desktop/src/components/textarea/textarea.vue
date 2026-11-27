<template>
  <div v-if="!readonly" :class="cls.e('wrapper')">
    <div :class="textareaClass" @mouseenter="hovered = true" @mouseleave="hovered = false">
      <textarea
        :class="cls.e('native')"
        :placeholder="placeholder"
        v-model="model"
        :maxlength="maxlength"
        :rows="rows"
        :cols="cols"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        :disabled="disabled"
        :readonly="nativeReadonly"
        ref="textareaRef"
      />
      <button
        v-if="canClear"
        :class="[cls.e('clear'), bem.is('visible', showClear)]"
        type="button"
        tabindex="-1"
        aria-label="清空"
        @mousedown.prevent
        @click.stop="handleClear"
      >
        <u-icon><Close /></u-icon>
      </button>
    </div>
    <div
      v-if="maxlength && showCount"
      :class="[cls.e('count'), bem.is('limit', count >= maxlength)]"
    >
      {{ count }}/{{ maxlength }}
    </div>
  </div>

  <span v-else :class="cls.m('readonly')">{{ model || FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup>
import './style'
import { useFocus, useFormFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, ref, shallowRef, watch } from 'vue'

import type { TextareaProps, TextareaEmits, ComponentSize } from '../../types'
import { UIcon } from '../icon'
import { calcTextareaHeight } from './utils'

defineOptions({ name: 'UTextarea' })

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: '请输入',
  resize: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  autosize: false
})

const cls = bem('textarea')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default' as ComponentSize,
  disabled: false,
  readonly: false
})

const emit = defineEmits<TextareaEmits>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const model = defineModel<string>()

const hovered = shallowRef(false)

const { focus, handleBlur, handleFocus } = useFocus((focused) => {
  focused ? emit('focus') : emit('blur')
})

const canClear = computed(() => props.clearable && !disabled.value && !props.nativeReadonly)

const count = computed(() => model.value?.length ?? 0)

/** 有内容且悬停或聚焦时才露出清空按钮 */
const showClear = computed(() => !!model.value && (hovered.value || focus.value))

const textareaClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    // 仅在清空按钮实际可见时预留右侧内边距，平常不浪费右侧空间
    bem.is('clear-visible', canClear.value && showClear.value),
    // autosize 下高度由内容决定，拖拽手柄无意义
    bem.is('resize-none', !props.resize || props.autosize),
    bem.is('disabled', disabled.value),
    bem.is('focus', focus.value),
    // form-item / table-editor 错误态描红挂在该修饰类上
    cls.m('more')
  ]
})

const handleInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  if (value.length > props.maxlength!) {
    const truncatedValue = value.slice(0, props.maxlength)
    emit('update:modelValue', truncatedValue)
  } else {
    emit('update:modelValue', value)
  }
}

const handleClear = () => {
  model.value = ''
  emit('clear')
}

const handleChange = (e: Event) => {
  emit('change', (e.target as HTMLTextAreaElement).value)
}

watch(
  [model, textareaRef],
  ([model, textareaRef]) => {
    if (!textareaRef) return
    if (!props.autosize) return
    calcTextareaHeight(textareaRef)
  },
  { immediate: true }
)
</script>
