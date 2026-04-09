<template>
  <div
    :class="inputClass"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    v-if="!readonly"
  >
    <span v-if="$slots.prefix || prefix" :class="prefixClass" @click="handlePrefixClick">
      {{ prefix }}
      <slot name="prefix"></slot>
    </span>

    <input
      :class="cls.e('native')"
      :placeholder="props.placeholder"
      type="text"
      :value="model"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      autocomplete="off"
      ref="el"
      :disabled="disabled"
      :readonly="nativeReadonly"
    />
    <UIcon
      v-if="clearable && !disabled && model"
      :class="[cls.e('clear'), bem.is('hidden', !hovered)]"
      title="清除"
      @click.stop="clearModelValue"
    >
      <Close />
    </UIcon>
    <span :class="suffixClass" @click="handleSuffixClick" v-if="$slots.suffix || suffix">
      {{ suffix }}
      <slot name="suffix"></slot>
    </span>
  </div>

  <template v-else>
    {{ generateModel || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="tsx" setup>
import { useFocus, useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import type { InputEmits, InputProps, _InputExposed } from '../../types'
import { bem } from '@ultra-ui/utils'
import { FORM_EMPTY_CONTENT } from '@ultra-ui/utils'
import { Close } from '@ultra-ui/icons/normal'
import { computed, getCurrentInstance, ref, shallowRef, nextTick } from 'vue'

import { UIcon } from '../icon'

defineOptions({
  name: 'Input'
})

const props = withDefaults(defineProps<InputProps>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<InputEmits>()

const model = defineModel<string>()

const inst = getCurrentInstance()

const cls = bem('input')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const { focus, handleBlur, handleFocus } = useFocus((focused) => {
  if (focused) {
    emit('focus')
  } else {
    emit('blur')
  }
})

const inputClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value),
    bem.is('focus', focus.value)
  ]
})

const prefixClass = [cls.e('prefix'), bem.is('clickable', !!inst?.vnode.props?.['onPrefix:click'])]

const suffixClass = [cls.e('suffix'), bem.is('clickable', !!inst?.vnode.props?.['onSuffix:click'])]

let isComposing = false

function handleCompositionStart() {
  isComposing = true
}

function handleCompositionEnd(e: Event) {
  isComposing = false
  handleInput(e)
}

const handleInput = (e: Event) => {
  if (isComposing) return

  const inputVal = (e.target as HTMLInputElement).value
  emit('native:input', e)

  const valid = props.pattern?.test(inputVal) ?? true

  if (!valid) return
  model.value = inputVal
}

const handlePrefixClick = () => {
  emit('prefix:click', model.value)
}

const handleSuffixClick = () => {
  emit('suffix:click', model.value)
}

const clearModelValue = () => {
  model.value = ''
  emit('clear')
}

const hovered = ref(false)
const handleMouseEnter = () => {
  hovered.value = true
}

const handleMouseLeave = () => {
  hovered.value = false
}

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement

  const valid = props.pattern?.test(target.value) ?? true

  if (valid) {
    emit('change', target.value)
  } else {
    nextTick(() => {
      target.value = model.value ?? ''
    })
  }
}

const el = shallowRef<HTMLInputElement>()

const generateModel = computed(() => {
  if (!model.value) return ''

  return `${props.prefix ?? ''}${model.value}${props.suffix ?? ''}`
})

defineExpose<_InputExposed>({
  el
})
</script>
