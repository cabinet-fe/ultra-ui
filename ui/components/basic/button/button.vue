<template>
  <button>
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { buttonProps } from './type'

const props = defineProps(buttonProps)
</script>

<script lang="ts">
export default {
  name: 'UButton'
}
</script>
