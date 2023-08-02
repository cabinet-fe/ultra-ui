<template>
  <u-input
    :model-value="displayed"
    @update:model-value="handleUpdateModelValue"
    @change="handleChange"
    ref="inputRef"
    :clearable="clearable"
  >
    <template #suffix> </template>
  </u-input>
</template>

<script lang="ts" setup>
import type { NumberInputEmits, NumberInputProps } from './number-input.type'
import { UInput, type InputExposed } from '../input'
import { nextTick, shallowRef, watch } from 'vue'
import { n } from 'cat-kit/fe'
import { useModel } from '@ui/compositions'

defineOptions({
  name: 'UNumberInput'
})

const props = defineProps<NumberInputProps>()
const emit = defineEmits<NumberInputEmits>()

const inputRef = shallowRef<InputExposed>()

/** 获取数字的显示内容 */
const getDisplayed = (value?: number): string => {
  if (value === undefined) {
    return ''
  }
  if (props.currency) {
    return n(value).currency('CNY', {
      precision: props.precision,
      minPrecision: props.minPrecision,
      maxPrecision: props.maxPrecision
    })
  }
  return String(value)
}

const model = useModel({ props, emit })

const displayed = shallowRef(getDisplayed(model.value))

watch(model, v => {
  displayed.value = getDisplayed(v)
})

const setCursorPosition = (cursorLastIndex: number) => {
  setTimeout(() => {
    let index = displayed.value.length - cursorLastIndex - 1
    if (!inputRef.value?.el) return
    inputRef.value.el.selectionStart = index
    inputRef.value.el.selectionEnd = index
  })
}

const handleUpdateModelValue = (value: string) => {
  if (value === displayed.value) return
  const number = value ? +value.replace(/\,/g, '') : undefined

  if (number === undefined) {
    return emit('update:modelValue', number)
  }

  if (isNaN(number)) return



  // 获取光标位置
  const cursorIndex = displayed.value.length - (inputRef.value?.el?.selectionStart ?? 0)

  setCursorPosition( cursorIndex)

  emit('update:modelValue', number)
}

const handleChange = (value: string) => {
  const number = +value

  displayed.value = getDisplayed(number)

  if (isNaN(number)) {
    nextTick(() => {
      displayed.value = getDisplayed(model.value)
    })
  }
}
</script>
