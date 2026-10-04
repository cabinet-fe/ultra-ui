<template>
  <u-dialog v-model="visible" title="新增字段" style="width: 420px" :auto-scroll="false">
    <div class="smart-table__form-row">
      <label class="smart-table__form-label">字段类型</label>
      <u-select v-model="draft.type" :options="typeOptions" :clearable="false" />
    </div>
    <div class="smart-table__form-row">
      <label class="smart-table__form-label">字段名称</label>
      <u-input v-model="draft.name" placeholder="如：优先级" />
    </div>
    <div v-if="isOptionsField(draft.type)" class="smart-table__form-row">
      <label class="smart-table__form-label">候选选项</label>
      <u-textarea
        v-model="draft.optionsText"
        :rows="4"
        placeholder="每行一个选项，单选/多选共用这些候选值"
      />
    </div>
    <div class="smart-table__form-row">
      <label class="smart-table__form-label">AI 场景</label>
      <u-select
        v-model="draft.scenario"
        :options="scenarioOptions"
        :clearable="false"
        placeholder="不使用 AI 时仅创建字段"
      />
    </div>
    <template v-if="draft.scenario !== ''">
      <div class="smart-table__form-row">
        <label class="smart-table__form-label">模型</label>
        <u-select v-model="draft.model" :options="modelOptions" :clearable="false" />
      </div>
      <div class="smart-table__form-row">
        <label class="smart-table__form-label">补充要求</label>
        <u-textarea
          v-model="draft.instruction"
          :rows="3"
          placeholder="可选。如：按紧急程度分类；提取负责人邮箱"
        />
      </div>
    </template>

    <template #footer>
      <u-button @click="visible = false">取消</u-button>
      <u-button type="primary" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { message } from '@veltra/desktop'
import { reactive, ref, watch } from 'vue'

import { AI_SCENARIOS, fetchAiModels, type AiFieldInput, type AiScenario } from './ai-field'
import { FIELD_TYPES, FIELD_TYPE_LABELS, isOptionsField, type FieldType } from './types'

/** 新增字段对话框：9 种类型 + 选项类字段配置；选 AI 场景（分类/总结/信息提取/内容生成）
    并选定模型后，确认即整列流式逐格回填（执行见 ai-field.ts） */
const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  confirm: [payload: { name: string; type: FieldType; options?: string[]; ai?: AiFieldInput }]
}>()

const typeOptions = FIELD_TYPES.map((type) => ({ label: FIELD_TYPE_LABELS[type], value: type }))
const scenarioOptions = AI_SCENARIOS.map(({ label, value }) => ({ label, value }))

/** AI 代理模型目录（对话框打开时拉取；失败回落「默认模型」= 空值走服务端默认） */
const modelOptions = ref<{ label: string; value: string }[]>([])

const draft = reactive({
  type: 'text' as FieldType,
  name: '',
  optionsText: '',
  scenario: '' as '' | AiScenario,
  model: '',
  instruction: ''
})

watch(visible, (open) => {
  if (!open) return
  draft.type = 'text'
  draft.name = ''
  draft.optionsText = ''
  draft.scenario = ''
  draft.instruction = ''
  void loadModels()
})

async function loadModels(): Promise<void> {
  const models = await fetchAiModels()
  modelOptions.value = models.length > 0 ? models : [{ label: '默认模型', value: '' }]
  draft.model = modelOptions.value[0]?.value ?? ''
}

function confirm(): void {
  const name = draft.name.trim()
  if (name === '') {
    message.error('请填写字段名称')
    return
  }
  let options: string[] | undefined
  if (isOptionsField(draft.type)) {
    options = Array.from(
      new Set(
        draft.optionsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      )
    )
    if (options.length === 0) {
      message.error('单选/多选字段至少需要一个候选选项（每行一个）')
      return
    }
  }
  const payload: { name: string; type: FieldType; options?: string[]; ai?: AiFieldInput } = {
    name,
    type: draft.type,
    options
  }
  if (draft.scenario !== '') {
    payload.ai = { scenario: draft.scenario, model: draft.model, instruction: draft.instruction }
  }
  emit('confirm', payload)
  visible.value = false
}
</script>

<style lang="scss" scoped>
.smart-table__form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;

  > :deep(.u-select),
  > :deep(.u-input),
  > :deep(.u-textarea) {
    flex: 1;
  }
}

.smart-table__form-label {
  flex: none;
  width: 60px;
  line-height: 32px;
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
