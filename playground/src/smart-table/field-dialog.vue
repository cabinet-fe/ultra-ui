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

    <template #footer>
      <u-button @click="visible = false">取消</u-button>
      <u-button type="primary" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { message } from '@veltra/desktop'
import { reactive, watch } from 'vue'

import { FIELD_TYPES, FIELD_TYPE_LABELS, isOptionsField, type FieldType } from './types'

/** 新增字段对话框：选类型 + 填名称，选项类字段（单选/多选）可配置候选选项 */
const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  confirm: [payload: { name: string; type: FieldType; options?: string[] }]
}>()

const typeOptions = FIELD_TYPES.map((type) => ({ label: FIELD_TYPE_LABELS[type], value: type }))

const draft = reactive({ type: 'text' as FieldType, name: '', optionsText: '' })

watch(visible, (open) => {
  if (open) {
    draft.type = 'text'
    draft.name = ''
    draft.optionsText = ''
  }
})

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
  emit('confirm', { name, type: draft.type, options })
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
