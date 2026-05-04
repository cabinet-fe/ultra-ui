<template>
  <div :class="classList">
    <div
      :class="headerClassList"
      role="button"
      :aria-expanded="isActive"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <span v-if="showLeftIcon" :class="cls.e('icon')">
        <slot name="icon" :is-active="isActive">
          <UIcon><component :is="iconComponent" /></UIcon>
        </slot>
      </span>

      <span :class="cls.e('title')">
        <slot name="title">{{ title }}</slot>
      </span>

      <span v-if="showRightIcon" :class="cls.e('icon')">
        <slot name="icon" :is-active="isActive">
          <UIcon><component :is="iconComponent" /></UIcon>
        </slot>
      </span>
    </div>
    <div ref="wrapperEl" :class="cls.e('content-wrapper')" :aria-hidden="!isActive">
      <div :class="cls.e('content')">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollapseItemProps } from '../../types'
import { UIcon } from '../icon'
import { CollapseDIKey } from './di'

defineOptions({
  name: 'CollapseItem'
})

const props = defineProps<CollapseItemProps>()

const context = inject(CollapseDIKey)

const cls = context?.cls ?? bem('collapse')

const isActive = computed(() => !!context?.activeValues.value.includes(props.value))

const iconPosition = computed(() => context?.iconPosition.value ?? 'right')

const iconComponent = computed(() => context?.expandIcon.value ?? ArrowRight)

const showLeftIcon = computed(() => !props.hideIcon && iconPosition.value === 'left')
const showRightIcon = computed(() => !props.hideIcon && iconPosition.value === 'right')

const classList = computed(() => [
  cls.e('item'),
  bem.is('active', isActive.value),
  bem.is('disabled', props.disabled)
])

const headerClassList = computed(() => [
  cls.e('header'),
  bem.is('disabled', props.disabled),
  bem.is('active', isActive.value)
])

const handleClick = () => {
  if (props.disabled) return
  context?.toggle(props.value)
}

const wrapperEl = ref<HTMLElement>()
let cleanupTransition: (() => void) | null = null

const cancelTransition = () => {
  cleanupTransition?.()
  cleanupTransition = null
}

// 用 height 数值过渡替代 grid-template-rows，避免每帧 grid 重排带来的卡顿。
const animateHeight = (active: boolean) => {
  const el = wrapperEl.value
  if (!el) return

  cancelTransition()

  const startHeight = el.offsetHeight
  const endHeight = active ? el.scrollHeight : 0

  if (startHeight === endHeight) {
    el.style.height = active ? 'auto' : '0px'
    return
  }

  el.style.height = `${startHeight}px`
  // 强制 reflow，确保起始高度被采纳，避免 0 → auto 直接跳变。
  void el.offsetHeight
  el.style.height = `${endHeight}px`

  const onEnd = (e: TransitionEvent) => {
    if (e.target !== el || e.propertyName !== 'height') return
    cleanup()
    if (active) {
      // 回归 auto，让后续内容动态变化时不被锁死高度。
      el.style.height = 'auto'
    }
  }

  const cleanup = () => {
    el.removeEventListener('transitionend', onEnd)
    el.removeEventListener('transitioncancel', onEnd)
    cleanupTransition = null
  }

  el.addEventListener('transitionend', onEnd)
  el.addEventListener('transitioncancel', onEnd)
  cleanupTransition = cleanup
}

onMounted(() => {
  if (!wrapperEl.value) return
  wrapperEl.value.style.height = isActive.value ? 'auto' : '0px'
})

watch(isActive, animateHeight)

onBeforeUnmount(cancelTransition)
</script>
