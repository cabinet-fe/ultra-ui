<template>
  <div
    :class="inputClass"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
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
      autocomplete="off"
      ref="el"
      v-bind="attrs"
      :disabled="disabled"
    />

    <Transition name="fade">
      <UIcon
        v-if="clearable && model && hovered"
        :class="cls.e('clear')"
        :size="14"
        @click="clearModelValue"
      >
        <CircleClose />
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
  useAttrs
} from 'vue'
import { CircleClose } from 'icon-ultra'
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

const handleInput = (e: Event) => {
  emit('native:input', e)
  model.value = (e.target as HTMLInputElement).value
}

const handlePrefixClick = () => {
  emit('prefix:click', model.value)
}

const handleSuffixClick = () => {
  emit('suffix:click', model.value)
}

const clearModelValue = () => {
  model.value = ''
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

const attrs = useAttrs()

defineExpose<_InputExposed>({
  el
})
</script>
