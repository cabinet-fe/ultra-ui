<template>
  <u-dialog
    v-model="visible"
    title="条件样式"
    style="width: min(960px, 92vw); max-height: 85vh"
    @close="onClose"
  >
    <div :class="cls.b">
      <p :class="cls.e('hint')">
        按列表顺序依次求值并合并样式。可指定求值字段（默认同绑定格字段）；作用范围为「整行」时染满物理输出行（含横向展开列与静态格）。交叉表下整行高亮会覆盖同行所有列，明细行报表更合适。
      </p>

      <ul v-if="draftItems.length" ref="parentRef" :class="cls.e('list')">
        <li v-for="(item, index) in draftItems" :key="item.id" :class="cls.e('item')">
          <u-report-rule-row
            :rule="item.rule"
            :binding-field="bindingField"
            :dataset-fields="datasetFields"
            :index="index"
            :total="draftItems.length"
            @update:rule="item.rule = $event"
            @remove="removeRule(index)"
            @move-up="moveRule(index, -1)"
            @move-down="moveRule(index, 1)"
          />
        </li>
      </ul>
      <p v-else :class="cls.e('empty')">暂无规则，点击下方按钮添加。</p>

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
