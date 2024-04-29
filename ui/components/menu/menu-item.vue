<template>
  <div
    :class="[
      cls?.e('item'),
      bem.is('active', injected?.activeIndex.value === index),
      bem.is('disabled', disabled)
    ]"
    @click="handleClick"
  >
    <UIcon :class="cls?.em('item', 'icon')">
      <component :is="icon" />
    </UIcon>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { MenuDIKey } from './di'
import type { MenuItemProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const props = defineProps<MenuItemProps>()

const handleClick = () => {
  if (!props.disabled) {
    injected!.activeIndex.value = props.index
  }
}
</script>
