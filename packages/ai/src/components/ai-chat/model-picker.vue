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
        >
          <div :class="cls.e('model-option-main')" @click="handleSelectModel(item)">
            <div :class="cls.e('model-option-head')">
              <span :class="cls.e('model-option-name')">{{ item.label ?? item.id }}</span>
              <span :class="cls.e('model-option-actions')">
                <button
                  v-if="item.reasoningLevels?.length"
                  type="button"
                  :class="[
                    cls.e('model-option-reasoning'),
                    bem.is('expanded', expandedReasoningId === item.id)
                  ]"
                  @click.stop="toggleReasoning(item)"
                >
                  <span>{{ getReasoningLabel(item) }}</span>
                  <UIcon :class="cls.e('model-option-reasoning-arrow')">
                    <ArrowDown />
                  </UIcon>
                </button>
                <!-- 勾选槽位固定占位：未选中也保留位置，保证推理等级按钮跨行对齐 -->
                <UIcon :class="[cls.e('model-option-check'), bem.is('hidden', item.id !== model)]">
                  <Check />
                </UIcon>
              </span>
            </div>
            <div v-if="item.description" :class="cls.e('model-option-desc')">
              {{ item.description }}
            </div>
          </div>

          <div
            v-if="item.reasoningLevels?.length"
            :class="[
              cls.e('reasoning-levels'),
              bem.is('expanded', expandedReasoningId === item.id)
            ]"
          >
            <div :class="cls.e('reasoning-levels-inner')">
              <div
                v-for="level in item.reasoningLevels"
                :key="level.value"
                :class="[
                  cls.e('reasoning-option'),
                  bem.is('active', isReasoningActive(item, level.value))
                ]"
                @click="handleSelectReasoning(item, level.value)"
              >
                <span>{{ level.label }}</span>
                <UIcon
                  :class="[
                    cls.e('model-option-check'),
                    bem.is('hidden', !isReasoningActive(item, level.value))
                  ]"
                >
                  <Check />
                </UIcon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import { UDropdown, UIcon } from '@veltra/desktop'
import { ArrowDown, Check } from '@veltra/icons/normal'
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

/** 当前内联展开思考强度的模型 id（手风琴，同时只展开一个） */
const expandedReasoningId = shallowRef<string>()

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

/** 胶囊文案：已选中模型展示当前推理等级，其余展示该模型的默认等级 */
const getReasoningLabel = (item: ChatModelOption) => {
  if (item.id === model.value && currentReasoningLabel.value) {
    return currentReasoningLabel.value
  }
  return item.reasoningLevels?.find((level) => level.value === resolveDefaultReasoningLevel(item))
    ?.label
}

const isReasoningActive = (item: ChatModelOption, value: string) => {
  return item.id === model.value && reasoningLevel.value === value
}

/** 关闭时收起内联思考强度，下次打开仍从模型列表开始 */
const handleVisibleChange = (visible: boolean) => {
  if (!visible) expandedReasoningId.value = undefined
}

/** 点击模型主体：直接选中模型，并同步到该模型默认推理等级 */
const handleSelectModel = (item: ChatModelOption) => {
  model.value = item.id
  reasoningLevel.value = resolveDefaultReasoningLevel(item)
  dropdownRef.value?.close()
}

/** 点击推理等级胶囊：内联展开/收起该模型的思考强度 */
const toggleReasoning = (item: ChatModelOption) => {
  expandedReasoningId.value = expandedReasoningId.value === item.id ? undefined : item.id
  nextTick(() => dropdownRef.value?.updateDropdown())
}

/** 选中思考强度：同时切到该等级所属模型，避免模型与推理等级错配 */
const handleSelectReasoning = (item: ChatModelOption, value: string) => {
  model.value = item.id
  reasoningLevel.value = value
  dropdownRef.value?.close()
}
</script>
