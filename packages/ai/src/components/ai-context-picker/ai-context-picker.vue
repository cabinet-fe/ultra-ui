<template>
  <UDropdown
    ref="dropdownRef"
    :class="cls.b"
    trigger="click"
    :direction="direction"
    :alignment="alignment"
    :disabled="disabled"
    width="auto"
    min-width="140px"
    :content-class="cls.e('panel')"
  >
    <template #trigger>
      <slot name="trigger">
        <button
          type="button"
          :class="[cls.e('trigger'), bem.is('disabled', disabled)]"
          :disabled="disabled"
          title="更多选项"
          aria-label="更多选项"
        >
          <UIcon>
            <Plus />
          </UIcon>
        </button>
      </slot>
    </template>

    <template #content>
      <div :class="cls.e('list')">
        <slot name="prepend" :close="close" />

        <UFilePicker
          v-if="upload"
          :multiple="multiple"
          :accept="accept"
          :disabled="disabled"
          @pick="handlePick"
        >
          <div :class="cls.e('option')">
            <UIcon :class="cls.e('option-icon')">
              <Attach />
            </UIcon>
            <span>{{ uploadLabel }}</span>
          </div>
        </UFilePicker>

        <div
          v-for="item in items"
          :key="item.key"
          :class="[cls.e('option'), bem.is('disabled', item.disabled)]"
          @click="handleSelectItem(item)"
        >
          <UIcon v-if="item.icon" :class="cls.e('option-icon')">
            <component :is="item.icon" />
          </UIcon>
          <div :class="cls.e('option-body')">
            <span :class="cls.e('option-label')">{{ item.label }}</span>
            <span v-if="item.description" :class="cls.e('option-desc')">
              {{ item.description }}
            </span>
          </div>
        </div>

        <slot :close="close" />
      </div>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import './style'
import { type DropdownExposed, UDropdown, UFilePicker, UIcon } from '@veltra/desktop'
import { Attach, Plus } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { useTemplateRef } from 'vue'

import type {
  _AiContextPickerExposed,
  AiContextPickerEmits,
  AiContextPickerItem,
  AiContextPickerProps
} from '../../types'
import { readFilesAsAttachments } from '../_shared/attachment'

defineOptions({ name: 'UAiContextPicker' })

const props = withDefaults(defineProps<AiContextPickerProps>(), {
  upload: true,
  uploadLabel: '上传附件',
  multiple: true,
  direction: 'top',
  alignment: 'start',
  disabled: false
})

const emit = defineEmits<AiContextPickerEmits>()

defineSlots<{
  trigger(): any
  prepend(scope: { close: () => void }): any
  default(scope: { close: () => void }): any
}>()

const cls = bem('ai-context-picker')
const dropdownRef = useTemplateRef<DropdownExposed>('dropdownRef')

/** 关闭下拉面板 */
const close = () => {
  dropdownRef.value?.close()
}

/** 处理本地文件拾取：立即关闭面板、透传原始 File，并异步转换为 ChatAttachment */
const handlePick = (files: File[]) => {
  close()
  emit('pick-files', files)
  void readFilesAsAttachments(files, props.maxAttachmentSize, 'UAiContextPicker').then((list) => {
    if (list.length) emit('add-attachments', list)
  })
}

/** 选中自定义上下文选项 */
const handleSelectItem = (item: AiContextPickerItem) => {
  if (item.disabled) return
  emit('select', item)
  close()
}

defineExpose<_AiContextPickerExposed>({ close })
</script>
