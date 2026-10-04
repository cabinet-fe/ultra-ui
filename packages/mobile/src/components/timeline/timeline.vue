<template>
  <ul :class="cls.b">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { TimelineProps } from '../../types/timeline'

defineOptions({ name: 'Timeline' })

defineProps<TimelineProps>()

const cls = bem('timeline')
</script>
