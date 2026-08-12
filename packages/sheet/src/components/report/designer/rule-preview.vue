<template>
  <span
    :class="[cls.b, rule.scope === 'row' && cls.m('row')]"
    :style="previewStyle"
    :title="previewTitle"
  >
    {{ previewLabel }}
  </span>
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

const previewLabel = computed(() => (props.rule.scope === 'row' ? '整行' : 'Aa'))

const previewTitle = computed(() =>
  props.rule.scope === 'row'
    ? '整行作用范围：命中后染满物理输出行（交叉表会染满整行，明细行报表更合适）'
    : '本格作用范围'
)
</script>
