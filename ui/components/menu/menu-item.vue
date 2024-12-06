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
    @click="menuEmit('item-click', menu)"
  >
    <MenuIcon :icon="menu.icon" />

    <!-- 文本 -->
    <span :class="cls.e('item-title')">
      {{ menu.title }}
    </span>

    <span :class="cls.e('item-expand')"></span>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, shallowRef, watch } from 'vue'
import { MenuDIKey } from './di'
import type { MenuItem } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import MenuIcon from './menu-icon.vue'

defineOptions({
  name: 'MenuItem'
})

const props = defineProps<{
  menu: MenuItem
  depth: number
}>()

const { cls, menuProps, menuEmit } = inject(MenuDIKey)!

const itemRef = shallowRef<HTMLElement>()

const active = computed(() => {
  return menuProps.currentPath === props.menu.path
})

watch([active, itemRef], ([active, itemRef]) => {
  active &&
    itemRef &&
    itemRef.scrollIntoView({
      block: 'center'
    })
})
</script>
