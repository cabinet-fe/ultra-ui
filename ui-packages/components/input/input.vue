<template>
  <u-form-component-wrapper>
    <div>
      <input type="text" v-model="model" />
    </div>
  </u-form-component-wrapper>
</template>

<script lang="ts" setup>
import { InputProps } from './input.type'
import { UFormComponentWrapper } from '../form-component-wrapper'

defineOptions({
  name: 'UInput'
})

defineProps<InputProps>()

const model = defineModel<string>({})
</script>
