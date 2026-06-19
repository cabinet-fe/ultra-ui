<template>
  <li
    :class="[
      cls.e('item'),
      bem.is('first-level', depth === 0),
      bem.is('active', active),
      bem.is('disabled', item.disabled ?? false)
    ]"
    ref="item"
    @click="handleClickItem"
  >
    <NavIcon v-if="item.icon" :icon="item.icon" :class="cls.e('icon')" />

    <!-- 文本 -->
    <span :class="cls.e('item-title')">
      {{ item.title }}
    </span>
  </li>
</template>

<script setup lang="ts">
import { bem } from '@veltra/utils'
import { useTemplateRef } from 'vue'

import type { NavItem } from '../../types'
import NavIcon from './nav-icon.vue'
import { useNavItem } from './use-nav-item'

defineOptions({ name: 'NavItem' })

const props = defineProps<{ item: NavItem; depth: number }>()

const itemRef = useTemplateRef('item')

const { cls, active, handleClickItem } = useNavItem({ itemProps: props, itemRef })
</script>
