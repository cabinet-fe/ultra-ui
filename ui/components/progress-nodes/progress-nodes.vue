<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { ProgressNodesProps } from '@ui/types'
import { bem } from '@ui/utils'

defineOptions({
  name: 'ProgressNodes'
})

defineProps<ProgressNodesProps>()

const cls = bem('progress-nodes')
</script>
