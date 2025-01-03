<template>
  <!-- 一级菜单 -->
  <u-tip v-if="depth === 0" direction="right" hide-arrow>
    <li
      :class="[
        collapsedCls.e('item'),
        bem.is('active', active),
        bem.is('first-level'),
        bem.is('disabled', menu.disabled ?? false)
      ]"
      ref="itemRef"
      @click="handleClickMenu"
    >
      <UMenuIcon
        v-if="menu.icon"
        :icon="menu.icon"
        :class="collapsedCls.e('icon')"
      />
      <span v-else>{{ menu.title[0] }}</span>
    </li>

    <template #content>
      {{ menu.title }}
    </template>
  </u-tip>

  <!-- 二级以及二级以下菜单 -->
  <li
    v-else
    :class="[
      collapsedCls.e('item'),
      bem.is('active', active),
      bem.is('disabled', menu.disabled ?? false)
    ]"
    ref="itemRef"
    @click="_handleClickMenu"
  >
    <UMenuIcon
      v-if="menu.icon"
      :icon="menu.icon"
      :class="collapsedCls.e('icon')"
    />

    <!-- 文本 -->
    <span :class="collapsedCls.e('item-title')">
      {{ menu.title }}
    </span>
  </li>
</template>

<script setup lang="ts">
import type { MenuItem } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import UMenuIcon from './menu-icon.vue'
import { useMenuItem } from './use-menu-item'

defineOptions({
  name: 'MenuItemCollapsed'
})

const props = defineProps<{
  menu: MenuItem
  depth: number
}>()

const emit = defineEmits(['click'])

const { collapsedCls, active, handleClickMenu, itemRef } = useMenuItem({
  itemProps: props
})

function _handleClickMenu() {
  handleClickMenu()
  emit('click')
}
</script>
