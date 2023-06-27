<template>
  <u-form-component-wrapper>
    <input type="text" v-model="model" />
  </u-form-component-wrapper>
</template>

<script lang="ts" setup>
import { InputProps } from './input.type'
import { UFormComponentWrapper } from '../form-component-wrapper'
import { shallowRef, watch } from 'vue'

defineOptions({
  name: 'UInput'
})

const props = defineProps<InputProps>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()


const model = shallowRef('')

watch(model, () => {

})


</script>
