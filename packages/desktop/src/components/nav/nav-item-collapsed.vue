<template>
  <!-- 一级导航 -->
  <u-tip v-if="depth === 0" direction="right" hide-arrow>
    <li
      :class="[
        collapsedCls.e('item'),
        bem.is('active', active),
        bem.is('first-level'),
        bem.is('disabled', item.disabled ?? false)
      ]"
      ref="item"
      @click="handleClickItem"
    >
      <UNavIcon v-if="item.icon" :icon="item.icon" :class="collapsedCls.e('icon')" />
      <span v-else>{{ item.title[0] }}</span>
    </li>

    <template #content>
      {{ item.title }}
    </template>
  </u-tip>

  <!-- 二级以及二级以下导航 -->
  <li
    v-else
    :class="[
      collapsedCls.e('item'),
      bem.is('active', active),
      bem.is('disabled', item.disabled ?? false)
    ]"
    ref="item"
    @click="_handleClickItem"
  >
    <UNavIcon v-if="item.icon" :icon="item.icon" :class="collapsedCls.e('icon')" />

    <!-- 文本 -->
    <span :class="collapsedCls.e('item-title')">
      {{ item.title }}
    </span>
  </li>
</template>

<script setup lang="ts">
import { bem } from '@veltra/utils'
import { useTemplateRef } from 'vue'

import type { NavItem } from '../../types'
import { UTip } from '../tip'
import UNavIcon from './nav-icon.vue'
import { useNavItem } from './use-nav-item'

defineOptions({ name: 'UNavItemCollapsed' })

const props = defineProps<{ item: NavItem; depth: number }>()

const itemRef = useTemplateRef('item')

const emit = defineEmits(['click'])

const { collapsedCls, active, handleClickItem } = useNavItem({ itemProps: props, itemRef })

function _handleClickItem() {
  handleClickItem()
  emit('click')
}
</script>
