<template>
  <div
    :class="cls.e('button-wrap')"
    :style="wrapperStyle"
    @mousedown="handleButtonDown"
  >
    <div :class="cls.e('button')" />
  </div>
</template>
<script lang="ts" setup>
import { inject } from 'vue'
import { sliderContextKey } from './di'
import { useSlideButton } from './_compositions'

let injected = inject(sliderContextKey)!

let { cls } = injected

const { wrapperStyle, handleButtonDown } = useSlideButton()
</script>
