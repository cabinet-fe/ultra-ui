<template>
  <input type="text" v-model="model" @change="handleChange" />
</template>

<script
  lang="ts"
  setup
  generic="M extends string | number | Array<string | number>"
>

import type { SelectEmits, SelectProps } from '@ui/types/components/select'

defineOptions({
  name: 'Select'
})

const props = defineProps<SelectProps>()

const emit = defineEmits<SelectEmits>()

const model = defineModel<SelectProps['modelValue']>()

const label = defineModel('label')

const handleChange = (e: Event) => {}
</script>
