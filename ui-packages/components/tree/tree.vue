<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { TreeProps } from './tree.type'

defineOptions({
  name: 'UTree'
})

defineProps<TreeProps>()

const cls = bem('tree')
</script>
