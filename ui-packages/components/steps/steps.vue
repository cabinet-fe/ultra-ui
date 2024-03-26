<template>
  <div :class="cls.b">steps</div>
</template>

<script lang="ts" setup>
import type { StepsProps } from '@ui/types/components/steps'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Steps'
})

defineProps<StepsProps>()

const cls = bem('steps')
</script>
