<template>
  <UDropdown
    ref="dropdownRef"
    trigger="click"
    width="auto"
    min-width="220px"
    :content-class="cls.e('model-panel')"
    @update:visible="handleVisibleChange"
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
      <div :class="cls.e('model-panel-list')">
        <div
          v-for="item in models"
          :key="item.id"
          :class="[cls.e('model-option'), bem.is('active', item.id === model)]"
          @click="handleSelectModel(item)"
        >
          <div :class="cls.e('model-option-head')">
            <span :class="cls.e('model-option-name')">{{ item.label ?? item.id }}</span>
            <span :class="cls.e('model-option-actions')">
              <button
                v-if="item.reasoningLevels?.length"
                type="button"
                :class="cls.e('model-option-reasoning')"
                @click.stop="openReasoningPanel(item)"
              >
                <span>{{ getDefaultReasoningLabel(item) }}</span>
                <UIcon>
                  <ArrowRight />
                </UIcon>
              </button>
              <UIcon v-if="item.id === model" :class="cls.e('model-option-check')">
                <Check />
              </UIcon>
            </span>
          </div>
          <div v-if="item.description" :class="cls.e('model-option-desc')">
            {{ item.description }}
          </div>
        </div>
      </div>

      <div v-if="reasoningPanelModel" :class="cls.e('reasoning-panel')">
        <div :class="cls.e('reasoning-panel-title')">思考强度</div>
        <div :class="cls.e('reasoning-panel-model')">
          {{ reasoningPanelModel.label ?? reasoningPanelModel.id }}
        </div>
        <div
          v-for="level in reasoningPanelModel.reasoningLevels"
          :key="level.value"
          :class="[cls.e('reasoning-option'), bem.is('active', isReasoningActive(level.value))]"
          @click="handleSelectReasoning(level.value)"
        >
          <span>{{ level.label }}</span>
          <UIcon v-if="isReasoningActive(level.value)" :class="cls.e('model-option-check')">
            <Check />
          </UIcon>
        </div>
      </div>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import { UDropdown, UIcon } from '@veltra/desktop'
import { ArrowDown, ArrowRight, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, shallowRef, useTemplateRef } from 'vue'

import type { ChatModelOption } from '../../providers'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatModelPicker' })

const props = defineProps<{
  /** 可选模型列表 */
  models: ChatModelOption[]
}>()

const model = defineModel<string | undefined>('model')
const reasoningLevel = defineModel<string | undefined>('reasoningLevel')

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const dropdownRef = useTemplateRef('dropdownRef')

/** 右侧展开的思考强度面板对应的模型 */
const reasoningPanelModel = shallowRef<ChatModelOption>()

const currentModel = computed(() => {
  return props.models.find((m) => m.id === model.value)
})

const currentReasoningLabel = computed(() => {
  return currentModel.value?.reasoningLevels?.find((level) => level.value === reasoningLevel.value)
    ?.label
})

/** 取模型默认推理等级：显式配置优先，缺省落到首个可选等级 */
const resolveDefaultReasoningLevel = (item: ChatModelOption) => {
  const levels = item.reasoningLevels ?? []
  if (!levels.length) return undefined
  return (
    levels.find((level) => level.value === item.defaultReasoningLevel)?.value ?? levels[0]?.value
  )
}

const getDefaultReasoningLabel = (item: ChatModelOption) => {
  return item.reasoningLevels?.find((level) => level.value === resolveDefaultReasoningLevel(item))
    ?.label
}

const isReasoningActive = (value: string) => {
  return reasoningPanelModel.value?.id === model.value && reasoningLevel.value === value
}

/** 关闭时收起相邻推理面板，下次打开仍从模型列表开始 */
const handleVisibleChange = (visible: boolean) => {
  if (!visible) reasoningPanelModel.value = undefined
}

/** 点击模型：直接选中模型，并同步到该模型默认推理等级 */
const handleSelectModel = (item: ChatModelOption) => {
  model.value = item.id
  reasoningLevel.value = resolveDefaultReasoningLevel(item)
  dropdownRef.value?.close()
}

/** 点击模型行右侧的默认推理等级：展开相邻的思考强度面板 */
const openReasoningPanel = (item: ChatModelOption) => {
  reasoningPanelModel.value = item
  nextTick(() => dropdownRef.value?.updateDropdown())
}

/** 选中思考强度：同时切到该面板对应模型，避免模型与推理等级错配 */
const handleSelectReasoning = (value: string) => {
  const item = reasoningPanelModel.value
  if (!item) return
  model.value = item.id
  reasoningLevel.value = value
  dropdownRef.value?.close()
}
</script>
