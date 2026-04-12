<template>
  <u-tip
    hide-arrow
    direction="right"
    alignment="start"
    :class="[collapsedCls.m(size), collapsedCls.e('panel')]"
    style="padding: 0"
    v-model:visible="visible"
  >
    <li :class="[collapsedCls.e('sub-content'), bem.is('first-level', depth === 0)]">
      <MenuIcon v-if="menu.icon" :icon="menu.icon" :class="collapsedCls.e('icon')" />

      <span v-else>{{ menu.title[0] }}</span>

      <template v-if="depth !== 0">
        <span :class="collapsedCls.e('sub-title')">
          {{ menu.title }}
        </span>

        <!-- 展开图标 -->
        <u-icon :class="[collapsedCls.e('sub-expand')]">
          <ArrowRight />
        </u-icon>
      </template>
    </li>

    <template #content>
      <u-scroll tag="ul" :class="collapsedCls.e('sub-list')">
        <template v-for="(child, index) of menu.children!" :key="getKey(index, parentKey)">
          <UMenuItemCollapsed
            v-if="!child.children?.length"
            :menu="child"
            :depth="depth + 1"
            @click="closeSubMenu"
          />

          <MenuSubCollapsed
            v-else
            :menu="child"
            :parent-key="getKey(index, parentKey)"
            :depth="depth + 1"
          />
        </template>
      </u-scroll>
    </template>
  </u-tip>
</template>

<script setup lang="ts">
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject, ref } from 'vue'

import type { MenuItem } from '../../types'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
import { UTip } from '../tip'
import { MenuDIKey } from './di'
import { getKey } from './helper'
import MenuIcon from './menu-icon.vue'
import UMenuItemCollapsed from './menu-item-collapsed.vue'

defineOptions({
  name: 'MenuSubCollapsed'
})

defineProps<{
  menu: MenuItem
  parentKey: string
  depth: number
}>()

const visible = ref(false)

function closeSubMenu() {
  visible.value = false
}

const { collapsedCls, size } = inject(MenuDIKey)!
</script>
