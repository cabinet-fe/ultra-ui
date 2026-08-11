<template>
  <span :class="cls.b" :style="previewStyle" title="规则效果预览"> Aa </span>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ConditionalRule } from '../../../report/types'

defineOptions({ name: 'UReportRulePreview' })

const props = defineProps<{ rule: ConditionalRule }>()

const cls = bem('report-rule-preview')

const previewStyle = computed(() => {
  const { fill, font } = props.rule.style
  return {
    backgroundColor: fill?.color || 'transparent',
    color: font?.color || 'inherit',
    fontWeight: font?.bold ? '700' : '400',
    fontStyle: font?.italic ? 'italic' : 'normal'
  }
})
</script>
