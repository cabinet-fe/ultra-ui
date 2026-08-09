<template>
  <u-dialog
    v-model="visible"
    title="条件样式"
    style="width: min(960px, 92vw); max-height: 85vh"
    @close="onClose"
  >
    <div class="conditional-rules-dialog">
      <p class="conditional-rules-dialog__hint">
        按列表顺序依次求值并合并样式；仅对当前绑定格自身的值生效。
      </p>

      <ul v-if="draftItems.length" ref="parentRef" class="conditional-rules-dialog__list">
        <li
          v-for="(item, index) in draftItems"
          :key="item.id"
          class="conditional-rules-dialog__item"
        >
          <conditional-rule-row
            :rule="item.rule"
            :field-type="fieldType"
            :index="index"
            :total="draftItems.length"
            @update:rule="item.rule = $event"
            @remove="removeRule(index)"
            @move-up="moveRule(index, -1)"
            @move-down="moveRule(index, 1)"
          />
        </li>
      </ul>
      <p v-else class="conditional-rules-dialog__empty">暂无规则，点击下方按钮添加。</p>

      <u-button size="small" plain @click="addRule">添加规则</u-button>
    </div>

    <template #footer>
      <u-button size="small" @click="visible = false">取消</u-button>
      <u-button size="small" type="primary" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { animations, useDnD } from '@veltra/compositions'
import { computed, ref, watch } from 'vue'

import type { ConditionalRule, DatasetField } from '../types'
import {
  cloneRulesFromDraft,
  createDraftItem,
  initDraftFromRules,
  type DraftRuleItem
} from './conditional-rules/helpers'
import ConditionalRuleRow from './conditional-rules/rule-row.vue'

defineOptions({ name: 'SheetReportConditionalRulesDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    rules: ConditionalRule[]
    fieldType?: DatasetField['type']
  }>(),
  { fieldType: 'number' }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [rules: ConditionalRule[]]
}>()

const draftItems = ref<DraftRuleItem[]>([])

const { parentRef } = useDnD<DraftRuleItem>({
  values: draftItems,
  dragHandle: '.conditional-rule-row__handle',
  plugins: [animations()]
})

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    draftItems.value = initDraftFromRules(props.rules, props.fieldType)
  }
)

function addRule(): void {
  draftItems.value = [...draftItems.value, createDraftItem(undefined, props.fieldType)]
}

function removeRule(index: number): void {
  draftItems.value = draftItems.value.filter((_, i) => i !== index)
}

function moveRule(index: number, delta: -1 | 1): void {
  const target = index + delta
  if (target < 0 || target >= draftItems.value.length) return
  const next = [...draftItems.value]
  const [item] = next.splice(index, 1)
  if (!item) return
  next.splice(target, 0, item)
  draftItems.value = next
}

function confirm(): void {
  emit('save', cloneRulesFromDraft(draftItems.value))
  visible.value = false
}

function onClose(): void {
  visible.value = false
}
</script>

<style scoped lang="scss">
.conditional-rules-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conditional-rules-dialog__hint {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.conditional-rules-dialog__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 420px;
  overflow: auto;
}

.conditional-rules-dialog__item {
  margin: 0;
}

.conditional-rules-dialog__empty {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}
</style>
