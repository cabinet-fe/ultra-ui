<template>
  <li
    :class="[
      cls.e('item'),
      bem.is('first-level', depth === 0),
      bem.is('active', active),
      bem.is('disabled', menu.disabled ?? false)
    ]"
    ref="item"
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
import type { MenuItem } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'
import MenuIcon from './menu-icon.vue'
import { useMenuItem } from './use-menu-item'
import { useTemplateRef } from 'vue'

defineOptions({ name: 'MenuItem' })

const props = defineProps<{ menu: MenuItem; depth: number }>()

const itemRef = useTemplateRef('item')

const { cls, active, handleClickMenu } = useMenuItem({ itemProps: props, itemRef })
</script>
