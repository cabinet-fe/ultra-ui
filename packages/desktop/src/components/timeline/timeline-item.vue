<template>
  <li :class="cls.e('item')">
    <div :class="[cls.e('node'), cls.em('node', color), bem.is('custom', !!slots.dot)]">
      <slot name="dot" />
    </div>
    <div :class="[cls.e('wrapper'), bem.is('timestamp-top', timestampPlacement === 'top')]">
      <div :class="cls.e('content')">
        <slot />
      </div>
      <div v-if="timestamp" :class="cls.e('timestamp')">{{ timestamp }}</div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import './style'
import { bem } from '@veltra/utils'
import { useSlots } from 'vue'

import type { TimelineItemProps } from '../../types'

defineOptions({ name: 'UTimelineItem' })

const {
  color = 'default',
  timestamp,
  timestampPlacement = 'bottom'
} = defineProps<TimelineItemProps>()

const cls = bem('timeline')

const slots = useSlots()
</script>
