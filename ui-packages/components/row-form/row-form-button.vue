<template>
  <div :class="cls.b" @click="onCreateData">
    <slot />
  </div>
</template>
<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { RowFormType } from './row-form.type'

const cls = bem('row-form-button')

const emit = defineEmits<RowFormType>()

/** 点击事件 */
const onCreateData = () => {
  emit('click')
}
</script>
