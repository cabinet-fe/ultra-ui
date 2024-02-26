<template>
  <u-form-item v-if="inForm" v-bind="getFormItemProps(props)">
    <component :is="renderInput()" />
  </u-form-item>
  <component v-else :is="renderInput()" />
</template>

<script lang="tsx" setup>
import type { InputEmits, InputProps, _InputExposed } from '@ui/types/components/input'
import { UFormItem } from '../form-item'
import { getFormItemProps } from '../form-item/utils'
import { useFormComponent, useFocus } from '@ui/compositions'
import { bem } from '@ui/utils'
import {
  computed,
  getCurrentInstance,
  ref,
  useSlots,
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
  size: 'default',
  clearable: true
})

const emit = defineEmits<InputEmits>()

const model = defineModel()

const inst = getCurrentInstance()

const cls = bem('input')

const { inForm, formProps } = useFormComponent(false)

const { focus, handleBlur, handleFocus } = useFocus(focused => {
  focused ? emit('focus') : emit('blur')
})

const slots = useSlots()

const inputClass = computed(() => {
  return [cls.b, cls.m(props.size), bem.is('focus', focus.value)]
})

// inst?.vnode.props?.['onPrefix:click']来获取当前组件是否绑定了点击事件
const prefixClass = [
  cls.e('prefix'),
  bem.is('clickable', !!inst?.vnode.props?.['onPrefix:click'])
]

const suffixClass = [
  cls.e('suffix'),
  bem.is('clickable', !!inst?.vnode.props?.['onSuffix:click'])
]

const handleInput = (e: Event) => {
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

const renderInput = () => {
  return (
    <div
      class={inputClass.value}
      onMouseenter={handleMouseEnter}
      onMouseleave={handleMouseLeave}
    >
      {slots.prefix || props.prefix ? (
        <span class={prefixClass} onClick={handlePrefixClick}>
          {slots.prefix?.() || props.prefix}
        </span>
      ) : null}

      <input
        class={cls.e('native')}
        placeholder={props.placeholder}
        type={props.password ? 'password' : 'text'}
        value={model.value}
        onInput={handleInput}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={el}
        {...attrs}
      />

      <Transition name='fade'>
        {props.clearable && model.value && hovered.value ? (
          <UIcon class={cls.e('clear')} size={14} onClick={clearModelValue}>
            <CircleClose />
          </UIcon>
        ) : null}
      </Transition>

      {slots.suffix || props.suffix ? (
        <span class={suffixClass} onClick={handleSuffixClick}>
          {slots.suffix?.() || props.suffix}
        </span>
      ) : null}
    </div>
  )
}

defineExpose<_InputExposed>({
  el
})
</script>
