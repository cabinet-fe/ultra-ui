<template>
  <div :class="cls.b">
    <label :class="cls.e('label')">
      {{ label }}
      <UIcon><InfoFilled /></UIcon>
    </label>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { FormItemProps } from './form-item.type'
import { UIcon } from '../icon'
import { InfoFilled } from 'icon-ultra'

defineOptions({
  name: 'UFormItem'
})

defineProps<FormItemProps>()

const cls = bem('form-item')
</script>
