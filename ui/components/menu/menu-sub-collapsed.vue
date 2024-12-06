<template>
  <u-tip hide-arrow direction="right" trigger="click" :class="cls.m('default')">
    <li :class="[cls.e('sub')]" style="width: 100%">
      <MenuIcon :icon="menu.icon" />
    </li>

    <template #content>
      <!-- @vue-ignore -->
      <transition
        @enter="enter"
        @after-enter="afterEnter"
        @leave="leave"
        @before-leave="beforeLeave"
        @after-leave="afterLeave"
      >
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
      </transition>
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
import { useMenuTransition } from './use-menu-transition'
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

const { enter, afterEnter, beforeLeave, leave, afterLeave } =
  useMenuTransition()
</script>
