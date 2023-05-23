<template>
  <input type="text" v-model="model" @change="handleChange" />
</template>

<script
  lang="ts"
  setup
  generic="M extends string | number | Array<string | number>"
>
import { SelectProps } from './select.type'

defineOptions({
  name: 'USelect'
})

defineProps<SelectProps>()

const model = defineModel<M>()

const label = defineModel<string>('label')

const emit = defineEmits<{
  (e: 's', v: M): void
}>()

const handleChange = (e: Event) => {}
</script>
