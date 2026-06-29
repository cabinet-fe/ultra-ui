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
      <span :class="cls.e('title')">
        <slot name="title">{{ title }}</slot>
      </span>

      <span :class="cls.e('icon')">
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

defineOptions({ name: 'UCollapseItem' })

const props = defineProps<CollapseItemProps>()

const context = inject(CollapseDIKey)!

const cls = context?.cls ?? bem('collapse')

const isActive = computed(() => !!context?.activeValues.value.includes(props.value))

const iconComponent = computed(() => context?.expandIcon.value ?? ArrowRight)

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

const { expandTransition } = context

onMounted(() => {
  context?.register(props.value)
  if (!wrapperEl.value) return
  expandTransition.setExpanded(wrapperEl.value, isActive.value)
})

watch(isActive, (active) => {
  if (!wrapperEl.value) return
  active ? expandTransition.expand(wrapperEl.value) : expandTransition.collapse(wrapperEl.value)
})

onBeforeUnmount(() => {
  context?.unregister(props.value)
  if (!wrapperEl.value) return
  expandTransition.cancel(wrapperEl.value)
})
</script>
