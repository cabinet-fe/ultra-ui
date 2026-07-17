<template>
  <li
    :class="[cls.e('item'), bem.is('active', active), bem.is('disabled', item.disabled ?? false)]"
    @click="handleClick"
  >
    <NavIcon v-if="item.icon" :icon="item.icon" :class="cls.e('icon')" />

    <span :class="cls.e('item-title')">
      {{ item.title }}
    </span>
  </li>
</template>

<script setup lang="ts">
import { bem } from '@veltra/utils'

import type { NavItem } from '../../types/nav'
import NavIcon from '../nav/nav-icon.vue'

defineOptions({ name: 'UGroupNavItem' })

const props = defineProps<{ item: NavItem; active: boolean }>()

const emit = defineEmits<{ (e: 'click', item: NavItem): void }>()

const cls = bem('group-nav')

function handleClick() {
  if (props.item.disabled) return
  emit('click', props.item)
}
</script>
