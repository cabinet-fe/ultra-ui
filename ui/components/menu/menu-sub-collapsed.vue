<template>
  <u-tip
    hide-arrow
    direction="right"
    alignment="start"
    trigger="click"
    :class="cls.m('default')"
  >
    <li :class="cls.e('sub')">
      <MenuIcon :icon="menu.icon" />

      <span :class="cls.e('sub-title')" v-if="depth !== 0">
        {{ menu.title }}
      </span>
    </li>

    <template #content>
      <ul :class="cls.e('sub-list')">
        <template
          v-for="(child, index) of menu.children!"
          :key="getKey(index, parentKey)"
        >
          <UMenuItemCollapsed
            v-if="!child.children?.length"
            :menu="child"
            :depth="depth + 1"
          />

          <MenuSubCollapsed
            v-else
            :menu="child"
            :parent-key="getKey(index, parentKey)"
            :depth="depth + 1"
          />
        </template>
      </ul>
    </template>
  </u-tip>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { MenuDIKey } from './di'
import { UTip } from '../tip'
import type { MenuItem } from '@ui/types/components/menu'
import UMenuItemCollapsed from './menu-item-collapsed.vue'
import { getKey } from './helper'
import MenuIcon from './menu-icon.vue'

defineOptions({
  name: 'MenuSubCollapsed'
})

defineProps<{
  menu: MenuItem
  parentKey: string
  depth: number
}>()

const { cls } = inject(MenuDIKey)!
</script>
