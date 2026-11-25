<template>
  <UDropdown
    ref="dropdownRef"
    :class="cls.b"
    trigger="click"
    :direction="direction"
    :alignment="alignment"
    :disabled="disabled"
    width="auto"
    min-width="240px"
    :content-class="cls.e('panel')"
  >
    <template #trigger>
      <button
        type="button"
        :class="[cls.e('trigger'), bem.is('disabled', disabled)]"
        :disabled="disabled"
      >
        <span :class="cls.e('trigger-label')">
          {{ currentModel?.label ?? modelValue ?? placeholder }}
        </span>
        <UIcon :class="cls.e('trigger-arrow')">
          <ArrowDown />
        </UIcon>
      </button>
    </template>

    <template #content>
      <UScroll :class="cls.e('panel-list')">
        <div
          v-for="item in models"
          :key="item.id"
          :class="[cls.e('option'), bem.is('active', item.id === modelValue)]"
        >
          <div :class="cls.e('option-main')" @click="handleSelect(item)">
            <div :class="cls.e('option-head')">
              <span :class="cls.e('option-name')">{{ item.label ?? item.id }}</span>
              <UIcon v-if="item.id === modelValue" :class="cls.e('option-check')">
                <Check />
              </UIcon>
            </div>
            <div v-if="item.description" :class="cls.e('option-desc')">
              {{ item.description }}
            </div>
          </div>
        </div>
      </UScroll>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import './style'
import { UDropdown, UIcon, UScroll } from '@veltra/desktop'
import { ArrowDown, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, useTemplateRef } from 'vue'

import type { ChatModel } from '../../providers'
import type { AiModelPickerEmits, AiModelPickerProps } from '../../types'

defineOptions({ name: 'UAiModelPicker' })

const props = withDefaults(defineProps<AiModelPickerProps>(), {
  placeholder: '模型',
  direction: 'top',
  alignment: 'end',
  disabled: false
})

const emit = defineEmits<AiModelPickerEmits>()

const cls = bem('ai-model-picker')
const dropdownRef = useTemplateRef('dropdownRef')

const currentModel = computed(() => {
  return props.models.find((m) => m.id === props.modelValue)
})

/** 选中模型后更新受控值、触发 change 并关闭面板 */
const handleSelect = (item: ChatModel) => {
  if (props.disabled) return
  emit('update:modelValue', item.id)
  emit('change', item.id, item)
  dropdownRef.value?.close()
}
</script>
