<template>
  <div
    :class="inputClass"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    v-if="!readonly"
  >
    <span
      v-if="$slots.prefix || prefix"
      :class="prefixClass"
      @click="handlePrefixClick"
    >
      <slot name="prefix">{{ prefix }}</slot>
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

    <Transition name="zoom-in" mode="out-in">
      <UIcon
        v-if="clearable && model && hovered && !disabled"
        :class="cls.e('clear')"
        @click.stop="clearModelValue"
      >
        <Close />
      </UIcon>
    </Transition>

    <span
      v-if="$slots.suffix || suffix"
      :class="suffixClass"
      @click="handleSuffixClick"
    >
      <slot name="suffix">{{ suffix }}</slot>
    </span>
  </div>

  <span v-else>
    {{ model }}
  </span>
</template>

<script lang="tsx" setup>
import type {
  InputEmits,
  InputProps,
  _InputExposed
} from '@ui/types/components/input'
import {
  useFocus,
  useFormComponent,
  useFormFallbackProps
} from '@ui/compositions'
import { bem } from '@ui/utils'
import {
  computed,
  getCurrentInstance,
  ref,
  Transition,
  shallowRef,
  nextTick
} from 'vue'
import { Close } from 'icon-ultra'
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

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const { focus, handleBlur, handleFocus } = useFocus(focused => {
  focused ? emit('focus') : emit('blur')
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

const prefixClass = [
  cls.e('prefix'),
  bem.is('clickable', !!inst?.vnode.props?.['onPrefix:click'])
]

const suffixClass = [
  cls.e('suffix'),
  bem.is('clickable', !!inst?.vnode.props?.['onSuffix:click'])
]

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
  if (props.pattern) {
    const valid = props.pattern.test(inputVal)
    if (!valid) {
      nextTick(() => {
        ;(e.target as HTMLInputElement).value = model.value ?? ''
      })
      return
    }
  }
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
  emit('change', (e.target as HTMLInputElement).value)
}

const el = shallowRef<HTMLInputElement>()

defineExpose<_InputExposed>({
  el
})
</script>
