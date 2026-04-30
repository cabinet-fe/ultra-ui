<template>
  <div :class="classList">
    <div
      :class="[cls.e('header'), bem.is('disabled', disabled), bem.is('active', isActive)]"
      role="button"
      :aria-expanded="isActive"
      :aria-disabled="disabled"
      tabindex="0"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <div :class="cls.e('title')">
        <slot name="title">{{ title }}</slot>
      </div>
      <div :class="cls.e('icon')">
        <slot name="icon">
          <UIcon><ArrowRight /></UIcon>
        </slot>
      </div>
    </div>
    <div :class="cls.e('content-wrapper')">
      <div :class="cls.e('content')">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { CollapseItemProps } from '../../types'
import { UIcon } from '../icon'
import { CollapseDIKey } from './di'

defineOptions({
  name: 'CollapseItem'
})

const props = defineProps<CollapseItemProps>()

const context = inject(CollapseDIKey)

const cls = context?.cls || bem('collapse')

const isActive = computed(() => {
  return context?.activeValues.value.includes(props.value)
})

const classList = computed(() => {
  return [cls.e('item'), bem.is('active', isActive.value), bem.is('disabled', props.disabled)]
})

const handleClick = () => {
  if (props.disabled) return
  context?.handleItemClick(props.value)
}
</script>
