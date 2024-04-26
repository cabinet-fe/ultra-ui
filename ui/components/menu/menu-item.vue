<template>
  <div
    :class="[cls?.e('item'), bem.is('active', injected?.activeIndex.value === index)]"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { MenuDIKey } from './di'
import type { MenuItemProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const props = defineProps<MenuItemProps>()

const handleClick = () => {
  injected!.activeIndex.value = props.index
}
</script>
