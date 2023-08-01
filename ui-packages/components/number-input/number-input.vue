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

const displayed = shallowRef('')

const model = useModel({ props, emit })



const setCursorPosition = (totalLen: number, cursorIndex: number) => {
  setTimeout(() => {
    let lastCursorIndex = totalLen - cursorIndex
    let index = totalLen - lastCursorIndex
    if (!inputRef.value?.el) return
    inputRef.value.el.selectionStart = index
    inputRef.value.el.selectionEnd = index
  })
}

/** 获取数字的显示内容 */
const getDisplayed = (value?: number): string => {
  if (value === undefined) return ''
  if (props.currency) {
    return n(value).currency('CNY', {
      precision: props.precision,
      minPrecision: props.minPrecision,
      maxPrecision: props.maxPrecision
    })
  }
  return String(value)
}

watch(model, (v) => {
  displayed.value = getDisplayed(v)
}, { immediate: true })

const handleUpdateModelValue = (value: string) => {
  displayed.value = value
  // 非货币
  if (!props.currency) {
    const number = +value
    if (!isNaN(number)) {
      model.value = number
    }
    return
  }

  const number = value ? +value.replace(/\,/g, '') : undefined

  displayed.value = number !== undefined ? n(number).currency('CNY') : ''

  const cursorIndex = inputRef.value?.el?.selectionStart ?? 0

  setCursorPosition(displayed.value.length, cursorIndex)
  // console.log(cursorIndex)

  if (number !== props.modelValue) {
    emit('update:modelValue', number)
  } else {
  }
}

const handleChange = (value: string) => {
  const number = +value
  if (isNaN(number)) {
    nextTick(() => {
      displayed.value = getDisplayed(model.value)
    })
  } else {
    displayed.value = getDisplayed(number)
  }
}
</script>
