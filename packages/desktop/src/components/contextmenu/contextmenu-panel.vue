<template>
  <ul v-bind="$attrs">
    <template v-for="(menu, index) of menus" :key="index">
      <li v-if="menu.divider" :class="cls.e('divider')" role="separator" />
      <UContextmenuSub v-else-if="menu.children?.length" :menu="menu" />
      <UContextmenuItem v-else :menu="menu" />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import { computed, inject, provide } from 'vue'

import type { ContextmenuItem } from '../../types'
import UContextmenuItem from './contextmenu-item.vue'
import UContextmenuSub from './contextmenu-sub.vue'
import { ContextmenuPanelDIKey, ContextmenuRootDIKey } from './di'

defineOptions({ name: 'UContextmenuPanel', inheritAttrs: false })

const { menus } = defineProps<{ menus: ContextmenuItem[] }>()

const { cls } = inject(ContextmenuRootDIKey)!

const showIconColumn = computed(() => menus.some((menu) => !menu.divider && !!menu.icon))
const showArrowColumn = computed(() =>
  menus.some((menu) => !menu.divider && !!menu.children?.length)
)

provide(ContextmenuPanelDIKey, { showIconColumn, showArrowColumn })
</script>
