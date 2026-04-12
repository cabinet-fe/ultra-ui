<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { ConditionEditorProps } from '../../types'

defineOptions({
  name: 'ConditionEditor'
})

defineProps<ConditionEditorProps>()

const cls = bem('condition-editor')
</script>
