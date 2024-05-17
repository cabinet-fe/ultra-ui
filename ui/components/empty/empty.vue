<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { EmptyProps } from '@ui/types/components/empty'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Empty'
})

defineProps<EmptyProps>()

const cls = bem('empty')
</script>
