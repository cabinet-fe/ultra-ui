<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { ConditionEditorProps } from '@ui/types'
import { bem } from '@ui/utils'

defineOptions({
  name: 'ConditionEditor'
})

defineProps<ConditionEditorProps>()

const cls = bem('condition-editor')
</script>
