<template>
<form></form>
</template>

<script lang="ts" setup>
import { FormProps } from './form.type'
import { provide } from 'vue'

defineOptions({
  name: 'UForm'
})

const props = defineProps<FormProps>()

provide('f', props)
</script>
