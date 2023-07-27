<template>
  <u-input
    :model-value="displayed"
    ref="inputRef"
    @update:model-value="handleUpdateModelValue"
  />
</template>

<script lang="ts" setup>
import type { NumberInputEmits, NumberInputProps } from './number-input.type'
import { UInput, type InputExposed } from '../input'
import { computed, shallowRef } from 'vue'
import { n } from 'cat-kit/fe'

defineOptions({
  name: 'UNumberInput'
})

const props = defineProps<NumberInputProps>()

const inputRef = shallowRef<InputExposed>()

const displayed = shallowRef('')

const emit = defineEmits<NumberInputEmits>()

const setCursorPosition = (totalLen: number, cursorIndex: number) => {
  setTimeout(() => {
    let lastCursorIndex = totalLen - cursorIndex
    let index = totalLen - lastCursorIndex
    if (!inputRef.value?.el) return
    inputRef.value.el.selectionStart = index
    inputRef.value.el.selectionEnd = index
  })
}

const handleUpdateModelValue = (value: string) => {
  const number = value ? +value.replace(/\,/g, '') : undefined

  const formatter = n.formatter({
    currency: 'CNY',
    precision: props.precision,
    maximumFractionDigits: props.maxPrecision,
    minimumFractionDigits: props.minPrecision
  })
  displayed.value = number !== undefined ? formatter.format(number) : ''

  const cursorIndex = inputRef.value?.el?.selectionStart ?? 0

  setCursorPosition(displayed.value.length, cursorIndex)
  // console.log(cursorIndex)

  if (number !== props.modelValue) {

    emit('update:modelValue', number)
  } else {

  }
}
</script>
