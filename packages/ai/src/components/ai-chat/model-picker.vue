<template>
  <UDropdown
    ref="dropdownRef"
    trigger="click"
    min-width="220px"
    :content-class="cls.e('model-panel')"
  >
    <template #trigger>
      <button type="button" :class="cls.e('model-trigger')">
        <span :class="cls.e('model-trigger-label')">
          {{ currentModel?.label ?? model ?? '模型' }}
        </span>
        <span v-if="currentReasoningLabel" :class="cls.e('model-trigger-reasoning')">
          {{ currentReasoningLabel }}
        </span>
        <UIcon :class="cls.e('model-trigger-arrow')">
          <ArrowDown />
        </UIcon>
      </button>
    </template>

    <template #content>
      <div
        v-for="item in models"
        :key="item.id"
        :class="[cls.e('model-option'), bem.is('active', item.id === model)]"
        @click="handleSelectModel(item.id)"
      >
        <div :class="cls.e('model-option-head')">
          <span>{{ item.label ?? item.id }}</span>
          <UIcon v-if="item.id === model" :class="cls.e('model-option-check')">
            <Check />
          </UIcon>
        </div>
        <div v-if="item.description" :class="cls.e('model-option-desc')">
          {{ item.description }}
        </div>
      </div>

      <template v-if="reasoningLevels.length">
        <div :class="cls.e('model-divider')" />

        <div :class="cls.e('reasoning-row')" @click="toggleReasoning">
          <span>思考强度</span>
          <span :class="cls.e('reasoning-row-value')">
            {{ currentReasoningLabel }}
            <UIcon>
              <ArrowDown v-if="reasoningExpanded" />
              <ArrowRight v-else />
            </UIcon>
          </span>
        </div>

        <template v-if="reasoningExpanded">
          <div
            v-for="level in reasoningLevels"
            :key="level.value"
            :class="[cls.e('reasoning-option'), bem.is('active', level.value === reasoningLevel)]"
            @click="handleSelectReasoning(level.value)"
          >
            <span>{{ level.label }}</span>
            <UIcon v-if="level.value === reasoningLevel" :class="cls.e('model-option-check')">
              <Check />
            </UIcon>
          </div>
        </template>
      </template>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import { UDropdown, UIcon } from '@veltra/desktop'
import { ArrowDown, ArrowRight, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, ref, useTemplateRef } from 'vue'

import type { ChatModelOption } from '../../providers'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatModelPicker' })

const props = defineProps<{
  /** 可选模型列表 */
  models: ChatModelOption[]
}>()

const model = defineModel<string>('model')
const reasoningLevel = defineModel<string>('reasoningLevel')

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const dropdownRef = useTemplateRef('dropdownRef')

/** 思考强度子列表是否展开 */
const reasoningExpanded = ref(false)

const currentModel = computed(() => {
  return props.models.find((m) => m.id === model.value)
})

const reasoningLevels = computed(() => currentModel.value?.reasoningLevels ?? [])

const currentReasoningLabel = computed(() => {
  return reasoningLevels.value.find((l) => l.value === reasoningLevel.value)?.label
})

/** 展开/收起思考强度子列表，并重置面板位置防止溢出 */
const toggleReasoning = () => {
  reasoningExpanded.value = !reasoningExpanded.value
  nextTick(() => dropdownRef.value?.updateDropdown())
}

/** 选中模型（推理等级校正在 useChat 中完成） */
const handleSelectModel = (id: string) => {
  model.value = id
  reasoningExpanded.value = false
  dropdownRef.value?.close()
}

const handleSelectReasoning = (value: string) => {
  reasoningLevel.value = value
  dropdownRef.value?.close()
}
</script>
