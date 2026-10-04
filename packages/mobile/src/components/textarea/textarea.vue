<template>
  <div v-if="!readonly" :class="textareaClass">
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
    <span v-if="props.maxlength && props.showCount" :class="cls.m('count')">
      {{ initNum }}/{{ props.maxlength }}
    </span>
    <Transition name="zoom-in">
      <button
        v-if="props.clearable && model && !disabled"
        :class="cls.m('clear')"
        type="button"
        aria-label="清空"
        @click.stop="handleClear"
      >
        <Close />
      </button>
    </Transition>
  </div>

  <span v-else :class="cls.m('readonly')">
    {{ model || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import { useFocus, useFormFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import type { ComponentSize } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import type { TextareaEmits, TextareaProps } from '../../types/textarea'
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

const { focus, handleBlur, handleFocus } = useFocus((focused) => {
  focused ? emit('focus') : emit('blur')
})

const textareaClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('resize-none', !props.resize),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value),
    bem.is('focus', focus.value),
    cls.m('more')
  ]
})

const handleInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  if (value.length > props.maxlength!) {
    // 如果输入的字符数超过了最大长度，截取字符串到最大长度
    const truncatedValue = value.slice(0, props.maxlength)
    emit('update:modelValue', truncatedValue)
  } else {
    // 如果没有超过最大长度，则正常更新模型值
    emit('update:modelValue', value)
  }
}

const initNum = computed(() => {
  if (!props.maxlength) return 0
  return props.maxlength - (model.value?.length ?? 0)
})

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
