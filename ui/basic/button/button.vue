<template>
  <button :class="cls.b">
    <slot v-for="item of a" v-bind="item" />
  </button>
</template>

<script lang="ts" setup>
import { ButtonProps } from './button.type'
import { bem } from '@ui/helper'

defineProps<ButtonProps>()

const cls = bem('button')

const  a = [{ name: '' }]
</script>

<script lang="ts">
export default {
  name: 'UButton'
}
</script>
