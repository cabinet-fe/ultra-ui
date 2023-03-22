<template>
  <button>
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { ButtonProps } from './button.type'

const props = defineProps<ButtonProps>()

</script>

<script lang="ts">
export default {
  name: 'UButton'
}
</script>
