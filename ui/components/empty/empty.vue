<template>
  <span :class="cls.b">
    <u-icon :size="size"> <Empty /> </u-icon>
    <div>{{ text }}</div>
  </span>
</template>

<script lang="ts" setup>
import type { EmptyProps } from '@ui/types/components/empty'
import { bem } from '@ui/utils'
import { Empty } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'Empty'
})

withDefaults(defineProps<EmptyProps>(), {
  size: 48,
  text: '空空如也'
})

const cls = bem('empty')
</script>
