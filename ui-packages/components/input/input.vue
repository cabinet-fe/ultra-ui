<template>
  <u-form-item v-if="inForm" v-bind="getFormItemProps(props)">
    <div :class="cls.b">
      <input
        :class="cls.e('native')"
        :placeholder="placeholder"
        type="text"
        v-model="model"
      />
    </div>
  </u-form-item>
</template>

<script lang="ts" setup>
import { InputProps } from './input.type'
import { UFormItem } from '../form-item'
import { getFormItemProps } from '../form-item/utils'
import { useModel, useFormComponent } from '@ui/compositions'
import { bem } from '@ui/utils'

defineOptions({
  name: 'UInput'
})

const props = withDefaults(defineProps<InputProps>(), {
  placeholder: '请输入'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const cls = bem('input')

const { inForm } = useFormComponent(false)

const model = useModel({
  props,
  propName: 'modelValue',
  emit
})
</script>
