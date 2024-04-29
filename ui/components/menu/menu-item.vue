<template>
  <div
    :class="[
      cls?.e('item'),
      bem.is('active', injected?.activeIndex.value === index),
      bem.is('disabled', disabled)
    ]"
    @click="handleClick"
    :style="{ textIndent }"
  >
    <UIcon :class="cls?.em('item', 'icon')" v-if="icon">
      <component :is="icon" />
    </UIcon>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, getCurrentInstance } from 'vue'
import { MenuDIKey, calcIndent } from './di'
import type { MenuItemProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'

defineOptions({
  name: 'MenuItem'
})

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const props = defineProps<MenuItemProps>()

const handleClick = () => {
  if (!props.disabled) {
    injected!.activeIndex.value = props.index
  }
}

const instance = getCurrentInstance()

const textIndent = ref<string>('0px')

watch(() => instance, () => {
  if (instance) textIndent.value = calcIndent(instance)
}, { immediate: true })
</script>
