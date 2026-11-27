<template>
  <u-tip v-model:visible="tipVisible" direction="right" hide-arrow :disabled="tipDisabled">
    <button
      ref="button"
      type="button"
      v-ripple="!app.disabled"
      :class="[
        cls.e('app'),
        bem.is('active', active),
        bem.is('selected', selected),
        bem.is('disabled', app.disabled ?? false)
      ]"
      :disabled="app.disabled"
      @click="handleClick"
      @mouseleave="handleMouseleave"
    >
      <UNavIcon v-if="app.icon" :icon="app.icon" :class="cls.e('app-icon')" />
      <span v-else :class="cls.e('app-fallback')">{{ app.title[0] }}</span>
      <span v-if="labeled" :class="cls.e('app-label')">{{ displayTitle }}</span>
    </button>

    <template #content>
      <div :class="cls.e('app-tip')">
        <div :class="cls.e('app-tip-title')">{{ app.title }}</div>
        <p v-if="app.description" :class="cls.e('app-tip-description')">
          {{ app.description }}
        </p>
      </div>
    </template>
  </u-tip>
</template>

<script setup lang="ts">
import './style'
import { vRipple } from '@veltra/directives'
import { bem, scrollIntoContainerView } from '@veltra/utils'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { DualNavRootItem } from '../../types'
import UNavIcon from '../nav/nav-icon.vue'
import { UTip } from '../tip'

defineOptions({ name: 'UDualNavApp' })

const cls = bem('dual-nav')

/** 左轨菜单名称最多展示字数 */
const LABEL_MAX_LENGTH = 4

const props = defineProps<{
  app: DualNavRootItem
  active: boolean
  selected: boolean
  labeled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()

const tipVisible = shallowRef(false)
/** 点击后暂时禁用 hover 弹出，移出触发区后恢复 */
const tipSuppressed = shallowRef(false)
const buttonRef = useTemplateRef('button')

/** 点击导致的激活不滚动：按钮已在左轨里 */
let changedByClick = false

watch([() => props.active, buttonRef], ([active, button]) => {
  if (changedByClick) {
    changedByClick = false
    return
  }
  if (!active || !button) return
  const rail = button.closest<HTMLElement>(`.${cls.e('rail')}`)
  if (!rail) return
  scrollIntoContainerView(button, rail)
})

const displayTitle = computed(() => props.app.title.slice(0, LABEL_MAX_LENGTH))

/** labeled 且标题未截断、无描述时，tooltip 无额外信息 */
const tipUnnecessary = computed(() => {
  return !!props.labeled && props.app.title.length <= LABEL_MAX_LENGTH && !props.app.description
})

const tipDisabled = computed(() => tipSuppressed.value || tipUnnecessary.value)

function handleClick() {
  if (!props.active) changedByClick = true
  tipSuppressed.value = true
  tipVisible.value = false
  emit('click')
}

function handleMouseleave() {
  tipSuppressed.value = false
}
</script>
