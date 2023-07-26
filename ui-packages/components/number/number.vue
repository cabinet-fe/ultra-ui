<template>
  {{ tween.state.number }}
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import { NumberProps } from './number.type'
import { Tween } from 'cat-kit/fe'

defineOptions({
  name: 'UNumber'
})

const props = defineProps<NumberProps>()

const tween = new Tween(
  reactive({
    number: props.value
  })
)

watch(
  () => props.value,
  v => {
    tween.to({ number: v })
  },
  { immediate: true }
)
</script>
