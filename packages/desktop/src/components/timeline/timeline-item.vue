<template>
  <li :class="cls.e('item')">
    <div :class="nodeClass">
      <slot name="dot" />
    </div>
    <div :class="cls.e('wrapper')">
      <div v-if="timestamp" :class="timestampClass">{{ timestamp }}</div>
      <div :class="cls.e('content')">
        <slot />
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, useSlots } from 'vue'

import type { TimelineItemProps } from '../../types'

defineOptions({ name: 'UTimelineItem' })

const {
  color = 'default',
  timestamp,
  timestampPlacement = 'bottom'
} = defineProps<TimelineItemProps>()

const cls = bem('timeline')

const slots = useSlots()

const nodeClass = computed(() => [
  cls.e('node'),
  cls.em('node', color),
  bem.is('custom', !!slots.dot)
])

const timestampClass = computed(() => [
  cls.e('timestamp'),
  ...(timestampPlacement === 'top' ? [cls.em('timestamp', 'top')] : [])
])
</script>
