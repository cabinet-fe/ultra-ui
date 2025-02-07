<template>
  <li
    :class="[
      cls.e('item'),
      bem.is('active', active),
      bem.is('disabled', menu.disabled ?? false)
    ]"
    :style="{
      paddingLeft: `${depth * 20 + 8}px`
    }"
    ref="itemRef"
    @click="handleClickMenu"
  >
    <MenuIcon v-if="menu.icon" :icon="menu.icon" :class="cls.e('icon')" />

    <!-- 文本 -->
    <span :class="cls.e('item-title')">
      {{ menu.title }}
    </span>
  </li>
</template>

<script setup lang="ts">
import type { MenuItem } from '@ui/types'
import { bem } from '@ui/utils'
import MenuIcon from './menu-icon.vue'
import { useMenuItem } from './use-menu-item'

defineOptions({
  name: 'MenuItem'
})

const props = defineProps<{
  menu: MenuItem
  depth: number
}>()

const { cls, active, handleClickMenu, itemRef } = useMenuItem({
  itemProps: props
})
</script>
