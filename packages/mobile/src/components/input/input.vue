<template>
  <div v-if="!readonly" v-bind="rootAttrs" :class="inputClass">
    <span v-if="$slots.prefix || prefix" :class="prefixClass" @click="handlePrefixClick">
      {{ prefix }}
      <slot name="prefix"></slot>
    </span>

    <input
      :class="cls.e('native')"
      :placeholder="props.placeholder"
      type="text"
      :value="model"
      v-bind="nativeAttrs"
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

    <span :class="suffixClass" v-if="hasSuffix">
      <Transition name="zoom-in" mode="out-in">
        <button
          v-if="showClear"
          :class="cls.e('clear')"
          type="button"
          aria-label="清除"
          @click.stop="clearModelValue"
          key="clear"
        >
          <Close />
        </button>

        <span v-else :class="cls.e('suffix-content')" @click="handleSuffixClick" key="suffix">
          {{ suffix }}
          <slot name="suffix"></slot>
        </span>
      </Transition>
    </span>
  </div>

  <template v-else>
    {{ generateModel || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useFocus, useFormFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, getCurrentInstance, nextTick, shallowRef, useAttrs } from 'vue'

import { bem } from '../../shared/bem'
import type { InputEmits, InputProps, _InputExposed } from '../../types/input'

defineOptions({ name: 'UInput', inheritAttrs: false })

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

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const { focus, handleBlur, handleFocus } = useFocus((focused) => {
  if (focused) {
    emit('focus')
  } else {
    emit('blur')
  }
})

/**
 * 透传到原生 input 的原生属性（输入约束与移动端键盘提示，如 inputmode 弹出数字键盘、
 * maxlength 限制长度），其余属性仍落在根元素上，不构成新的公开 prop
 */
const NATIVE_INPUT_ATTRS = ['inputmode', 'enterkeyhint', 'maxlength'] as const

const attrs = useAttrs()

const nativeAttrs = computed(() => o(attrs as Record<string, any>).pick([...NATIVE_INPUT_ATTRS]))

const rootAttrs = computed(() => o(attrs as Record<string, any>).omit([...NATIVE_INPUT_ATTRS]))

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

// 移动端无 hover，有值即展示清除按钮
const showClear = computed(() => {
  return props.clearable && !disabled.value && !!model.value
})

const hasSuffixContent = computed(() => {
  return !!inst?.slots.suffix || !!props.suffix
})

const hasSuffix = computed(() => {
  return hasSuffixContent.value || showClear.value
})

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

defineExpose<_InputExposed>({ el })
</script>
