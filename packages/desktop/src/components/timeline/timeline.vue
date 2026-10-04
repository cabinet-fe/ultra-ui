<template>
  <ul :class="cls.b">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { TimelineProps } from '../../types'

defineOptions({ name: 'UTimeline' })

defineProps<TimelineProps>()

const cls = bem('timeline')
</script>
