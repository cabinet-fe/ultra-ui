<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { ConditionEditorProps } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'

defineOptions({
  name: 'ConditionEditor'
})

defineProps<ConditionEditorProps>()

const cls = bem('condition-editor')
</script>
