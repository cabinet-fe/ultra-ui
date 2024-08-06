<template>
  <div
    v-if="!readonly"
    :class="textareaClass"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
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
    <Transition name="zoom-in" mode="out-in">
      <u-icon
        v-if="props.clearable && model! && hovered && !disabled && !readonly"
        :class="cls.m('clear')"
        @click.stop="handleClear"
      >
        <Close />
      </u-icon>
    </Transition>
  </div>

  <span v-else style="white-space: pre-wrap">
    {{ model || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import type {
  TextareaProps,
  TextareaEmits
} from '@ui/types/components/textarea'
import { bem } from '@ui/utils'
import { computed, ref, shallowRef, watch } from 'vue'
import { UIcon } from '../icon'
import { Close } from 'icon-ultra'
import {
  useFocus,
  useFormComponent,
  useFormFallbackProps
} from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { calcTextareaHeight } from './utils'
import { FORM_EMPTY_CONTENT } from '@ui/shared'

defineOptions({
  name: 'Textarea'
})

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: '请输入',
  resize: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const cls = bem('textarea')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default' as ComponentSize,
    disabled: false,
    readonly: false
  }
)

const emit = defineEmits<TextareaEmits>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const model = defineModel<string>()

const hovered = shallowRef(false)

const { focus, handleBlur, handleFocus } = useFocus(focused => {
  focused ? emit('focus') : emit('blur')
})

const textareaClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('resize-none', !props.resize),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value),
    bem.is('focus', focus.value)
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
    calcTextareaHeight(textareaRef)
  },
  { immediate: true }
)
</script>
