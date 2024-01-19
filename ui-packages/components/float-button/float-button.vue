<template>
  <Teleport to="body">
    <div :class="cls.b">
      <u-icon v-if="icon"> <component :is="icon" /> </u-icon>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { FloatButtonProps } from '@ui/types/components/float-button'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'

defineOptions({
  name: 'FloatButton'
})

defineProps<FloatButtonProps>()

const cls = bem('float-button')
</script>
