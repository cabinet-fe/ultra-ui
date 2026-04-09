<template>
  <span :class="cls.b">
    <u-icon :size="size"> <Empty /> </u-icon>
    <div>{{ text }}</div>
  </span>
</template>

<script lang="ts" setup>
import type { EmptyProps } from '../../types'
import { bem } from '@ultra-ui/utils'
import { Empty } from '@ultra-ui/icons/normal'
import { UIcon } from '../icon'

defineOptions({
  name: 'Empty'
})

withDefaults(defineProps<EmptyProps>(), {
  size: 48,
  text: '暂无数据'
})

const cls = bem('empty')
</script>
