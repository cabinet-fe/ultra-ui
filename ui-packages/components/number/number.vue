<template>
  {{ formatted }}
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import type { NumberProps } from '@ui/types/components/number'
import { Tween, n } from 'cat-kit/fe'

defineOptions({
  name: 'Number'
})

const props = defineProps<NumberProps>()

const number = reactive({
  value: props.value
})

const tween = computed(() =>
  props.tween
    ? new Tween(number)
    : null
)

const formatter = n.formatter({
  currency: 'CNY',
  precision: props.precision
})

const formatted = computed(() => {
  return formatter.format(number.value)
})

watch(
  () => props.value,
  () => {
    props.tween
      ? tween.value?.to({ value: props.value })
      : (number.value = props.value)
  }
)
</script>
