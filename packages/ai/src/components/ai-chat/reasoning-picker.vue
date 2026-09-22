<template>
  <UDropdown
    v-if="levels.length > 1"
    ref="dropdownRef"
    trigger="click"
    direction="top"
    alignment="end"
    width="auto"
    min-width="140px"
    :content-class="cls.e('reasoning-panel')"
  >
    <template #trigger>
      <button type="button" :class="cls.e('reasoning-trigger')" title="推理等级">
        <span :class="cls.e('reasoning-trigger-label')">{{ currentLabel }}</span>
        <UIcon :class="cls.e('reasoning-trigger-arrow')">
          <ArrowDown />
        </UIcon>
      </button>
    </template>

    <template #content>
      <div :class="cls.e('reasoning-list')">
        <div
          v-for="level in levels"
          :key="level.value"
          :class="[cls.e('reasoning-option'), bem.is('active', level.value === reasoningLevel)]"
          @click="handleSelect(level.value)"
        >
          <span>{{ level.label }}</span>
          <UIcon v-if="level.value === reasoningLevel" :class="cls.e('reasoning-check')">
            <Check />
          </UIcon>
        </div>
      </div>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import { UDropdown, UIcon } from '@veltra/desktop'
import { ArrowDown, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, useTemplateRef } from 'vue'

import type { ChatReasoningLevel } from '../../providers'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatReasoningPicker' })

const { levels } = defineProps<{
  /** 当前模型的推理等级列表；不足两档时没有切换意义，不渲染 */
  levels: ChatReasoningLevel[]
}>()

const reasoningLevel = defineModel<string | undefined>('reasoningLevel')

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const dropdownRef = useTemplateRef('dropdownRef')

const currentLabel = computed(() => {
  return levels.find((level) => level.value === reasoningLevel.value)?.label ?? '推理'
})

const handleSelect = (value: string) => {
  reasoningLevel.value = value
  dropdownRef.value?.close()
}
</script>
