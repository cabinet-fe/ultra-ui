<template>
  <UDropdown
    v-if="levels.length > 1"
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
      <button
        type="button"
        :class="[cls.e('trigger'), bem.is('disabled', disabled)]"
        :disabled="disabled"
        title="推理等级"
      >
        <span :class="cls.e('trigger-label')">{{ currentLabel }}</span>
        <UIcon :class="cls.e('trigger-arrow')">
          <ArrowDown />
        </UIcon>
      </button>
    </template>

    <template #content>
      <div :class="cls.e('list')">
        <div
          v-for="level in levels"
          :key="level.value"
          :class="[cls.e('option'), bem.is('active', level.value === modelValue)]"
          @click="handleSelect(level)"
        >
          <span>{{ level.label }}</span>
          <UIcon v-if="level.value === modelValue" :class="cls.e('check')">
            <Check />
          </UIcon>
        </div>
      </div>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import './style'
import { UDropdown, UIcon } from '@veltra/desktop'
import { ArrowDown, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, useTemplateRef } from 'vue'

import type { ChatReasoningLevel } from '../../providers'
import type { AiReasoningPickerEmits, AiReasoningPickerProps } from '../../types'

defineOptions({ name: 'UAiReasoningPicker' })

const props = withDefaults(defineProps<AiReasoningPickerProps>(), {
  placeholder: '推理',
  direction: 'top',
  alignment: 'end',
  disabled: false
})

const emit = defineEmits<AiReasoningPickerEmits>()

const cls = bem('ai-reasoning-picker')
const dropdownRef = useTemplateRef('dropdownRef')

const currentLabel = computed(() => {
  return props.levels.find((level) => level.value === props.modelValue)?.label ?? props.placeholder
})

/** 选中推理等级后更新受控值、触发 change 并关闭面板 */
const handleSelect = (level: ChatReasoningLevel) => {
  if (props.disabled) return
  emit('update:modelValue', level.value)
  emit('change', level.value, level)
  dropdownRef.value?.close()
}
</script>
