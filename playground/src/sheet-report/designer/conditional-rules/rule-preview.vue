<template>
  <span class="conditional-rule-preview" :style="previewStyle" title="规则效果预览"> Aa </span>
</template>

<script lang="ts" setup>
import type { ConditionalRule } from '@veltra/sheet'
import { computed } from 'vue'

defineOptions({ name: 'SheetReportConditionalRulePreview' })

const props = defineProps<{ rule: ConditionalRule }>()

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

<style scoped lang="scss">
.conditional-rule-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 4px;
  font-size: 13px;
  line-height: 1;
  box-sizing: border-box;
}
</style>
