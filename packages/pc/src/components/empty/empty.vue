<template>
  <span :class="cls.b">
    <u-icon :size="size"> <PackageOpen /> </u-icon>
    <div>{{ text }}</div>
  </span>
</template>

<script lang="ts" setup>
import type { EmptyProps } from '@ultra-ui/pc/types'
import { bem } from '@ultra-ui/core'
import { PackageOpen } from 'lucide-vue-next'
import { UIcon } from '../icon'

defineOptions({
  name: 'UEmpty'
})

withDefaults(defineProps<EmptyProps>(), {
  size: 48,
  text: '暂无数据'
})

const cls = bem('empty')
</script>
