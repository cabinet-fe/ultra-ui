<template>
  <input type="text" v-model="model" @change="handleChange" />
</template>

<script
  lang="ts"
  setup
  generic="M extends string | number | Array<string | number>"
>
import { useModel } from '@ui/compositions'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'

defineOptions({
  name: 'Select'
})

const props = defineProps<SelectProps>()

const emit = defineEmits<SelectEmits>()

const model = useModel({ props, emit })
useModel({ props, emit, propName: 'label' })

const handleChange = (e: Event) => {}
</script>
