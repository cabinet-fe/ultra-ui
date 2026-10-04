<template>
  <u-dialog
    :model-value="field !== null"
    title="列设置"
    style="width: 420px"
    :auto-scroll="false"
    @update:model-value="emit('close')"
  >
    <div class="smart-table__form-row">
      <label class="smart-table__form-label">字段名称</label>
      <u-input v-model="draft.name" placeholder="字段名称" />
    </div>
    <div class="smart-table__form-row">
      <label class="smart-table__form-label">字段类型</label>
      <u-select v-model="draft.type" :options="typeOptions" :clearable="false" />
    </div>
    <div v-if="isOptionsField(draft.type)" class="smart-table__form-row">
      <label class="smart-table__form-label">选项管理</label>
      <div class="smart-table__options">
        <div
          v-for="(option, index) in draft.options"
          :key="option"
          class="smart-table__options-item"
        >
          <span class="smart-table__options-text">{{ option }}</span>
          <u-button size="small" text type="danger" @click="draft.options.splice(index, 1)">
            删除
          </u-button>
        </div>
        <div class="smart-table__options-add">
          <u-input
            v-model="draft.newOption"
            placeholder="新选项名称"
            @keydown.enter.prevent="addOption"
          />
          <u-button size="small" @click="addOption">添加</u-button>
        </div>
        <p v-if="draft.options.length === 0" class="smart-table__options-hint">
          单选/多选字段至少保留一个选项
        </p>
      </div>
    </div>

    <template #footer>
      <u-button @click="emit('close')">取消</u-button>
      <u-button type="primary" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { message } from '@veltra/desktop'
import { reactive, watch } from 'vue'

import { FIELD_TYPES, FIELD_TYPE_LABELS, isOptionsField, type TableField } from './types'
import type { FieldPatch } from './use-table-doc'

/**
 * 列设置面板：改字段名 / 改类型 / 选项管理（增删选项）。确定后一次性写回
 * doc（`updateField` 负责既有值按新类型与选项清洗），列头、渲染与编辑器
 * 随字段签名变化由 `use-smart-sheet` 重建同步。
 */
const props = defineProps<{ field: TableField | null }>()

const emit = defineEmits<{ close: []; apply: [patch: FieldPatch] }>()

const typeOptions = FIELD_TYPES.map((type) => ({ label: FIELD_TYPE_LABELS[type], value: type }))

const draft = reactive({
  name: '',
  type: 'text' as TableField['type'],
  options: [] as string[],
  newOption: ''
})

watch(
  () => props.field,
  (field) => {
    if (!field) return
    draft.name = field.name
    draft.type = field.type
    draft.options = [...(field.options ?? [])]
    draft.newOption = ''
  }
)

function addOption(): void {
  const option = draft.newOption.trim()
  if (option === '') {
    message.error('选项名称不能为空')
    return
  }
  if (draft.options.includes(option)) {
    message.error('选项已存在')
    return
  }
  draft.options.push(option)
  draft.newOption = ''
}

function confirm(): void {
  const name = draft.name.trim()
  if (name === '') {
    message.error('请填写字段名称')
    return
  }
  if (isOptionsField(draft.type) && draft.options.length === 0) {
    message.error('单选/多选字段至少保留一个选项')
    return
  }
  emit('apply', {
    name,
    type: draft.type,
    options: isOptionsField(draft.type) ? draft.options : undefined
  })
  emit('close')
}
</script>

<style lang="scss" scoped>
.smart-table__form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;

  > :deep(.u-select),
  > :deep(.u-input) {
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

.smart-table__options {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.smart-table__options-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--u-border-color, #dcdfe6);
  border-radius: 6px;
}

.smart-table__options-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--u-text-color-main);
}

.smart-table__options-add {
  display: flex;
  gap: 8px;

  > :deep(.u-input) {
    flex: 1;
  }
}

.smart-table__options-hint {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
