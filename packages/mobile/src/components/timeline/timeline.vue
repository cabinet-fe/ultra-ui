<template>
  <ul :class="cls.b">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '../../shared/bem'
import type { TimelineProps } from '../../types/timeline'

defineOptions({ name: 'UTimeline' })

defineProps<TimelineProps>()

const cls = bem('timeline')
</script>
