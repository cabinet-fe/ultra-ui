<template>
  <UDropdown
    ref="dropdownRef"
    trigger="click"
    direction="top"
    alignment="end"
    width="auto"
    min-width="240px"
    :content-class="cls.e('model-panel')"
  >
    <template #trigger>
      <button type="button" :class="cls.e('model-trigger')">
        <span :class="cls.e('model-trigger-label')">
          {{ currentModel?.label ?? model ?? '模型' }}
        </span>
        <UIcon :class="cls.e('model-trigger-arrow')">
          <ArrowDown />
        </UIcon>
      </button>
    </template>

    <template #content>
      <UScroll :class="cls.e('model-panel-list')">
        <div
          v-for="item in models"
          :key="item.id"
          :class="[cls.e('model-option'), bem.is('active', item.id === model)]"
        >
          <div :class="cls.e('model-option-main')" @click="handleSelectModel(item)">
            <div :class="cls.e('model-option-head')">
              <span :class="cls.e('model-option-name')">{{ item.label ?? item.id }}</span>
              <UIcon v-if="item.id === model" :class="cls.e('model-option-check')">
                <Check />
              </UIcon>
            </div>
            <div v-if="item.description" :class="cls.e('model-option-desc')">
              {{ item.description }}
            </div>
          </div>
        </div>
      </UScroll>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import { UDropdown, UIcon, UScroll } from '@veltra/desktop'
import { ArrowDown, Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, useTemplateRef } from 'vue'

import type { ChatModelOption } from '../../providers'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatModelPicker' })

const props = defineProps<{
  /** 可选模型列表 */
  models: ChatModelOption[]
}>()

const model = defineModel<string | undefined>('model')

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const dropdownRef = useTemplateRef('dropdownRef')

const currentModel = computed(() => {
  return props.models.find((m) => m.id === model.value)
})

/** 选中模型即关闭；推理等级由 useChat 的模型联动校正 */
const handleSelectModel = (item: ChatModelOption) => {
  model.value = item.id
  dropdownRef.value?.close()
}
</script>
