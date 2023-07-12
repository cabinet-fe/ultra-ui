<template>
  <slot />
</template>

<script lang="ts" setup>
import { FormComponentWrapperProps } from './form-component-wrapper.type'

defineOptions({
  name: 'UFormComponentWrapper'
})

defineProps<FormComponentWrapperProps>()
</script>
