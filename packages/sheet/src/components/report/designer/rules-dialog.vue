<template>
  <u-dialog
    v-model="visible"
    title="条件样式"
    style="width: min(600px, 92vw); max-height: 85vh"
    @close="onClose"
  >
    <div :class="cls.b">
      <p :class="cls.e('hint')">规则按顺序叠加。整行高亮适合明细表，交叉表会染满整行。</p>

      <ul v-if="draftItems.length" ref="parentRef" :class="cls.e('list')">
        <li v-for="(item, index) in draftItems" :key="item.id" :class="cls.e('item')">
          <u-report-rule-row
            :rule="item.rule"
            :binding-field="bindingField"
            :dataset-fields="datasetFields"
            @update:rule="item.rule = $event"
            @remove="removeRule(index)"
          />
        </li>
      </ul>
      <p v-else :class="cls.e('empty')">还没有规则。</p>

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
import { UButton, UDialog } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import type { ConditionalRule, DatasetField } from '../../../report/types'
import {
  cloneRulesFromDraft,
  createDraftItem,
  initDraftFromRules,
  type DraftRuleItem
} from './conditional-rules/helpers'
import UReportRuleRow from './rule-row.vue'

defineOptions({ name: 'UReportRulesDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    rules: ConditionalRule[]
    bindingField: string
    datasetFields?: readonly DatasetField[]
    /** @deprecated 使用 datasetFields + resolveEvalFieldType */
    fieldType?: DatasetField['type']
  }>(),
  { datasetFields: () => [], fieldType: 'number' }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [rules: ConditionalRule[]]
}>()

const cls = bem('report-rules-dialog')

const draftItems = ref<DraftRuleItem[]>([])

const { parentRef } = useDnD<DraftRuleItem>({
  values: draftItems,
  dragHandle: '.u-report-rule-row__handle',
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
    draftItems.value = initDraftFromRules(props.rules, props.fieldType, props.bindingField)
  }
)

function addRule(): void {
  draftItems.value = [
    ...draftItems.value,
    createDraftItem(undefined, props.fieldType, props.bindingField)
  ]
}

function removeRule(index: number): void {
  draftItems.value = draftItems.value.filter((_, i) => i !== index)
}

function confirm(): void {
  emit('save', cloneRulesFromDraft(draftItems.value))
  visible.value = false
}

function onClose(): void {
  visible.value = false
}
</script>
