<template>
  <li :class="cls.e('item')" v-ripple="!disabled" @click="emit('click', menu)">
    <u-icon v-if="menu.icon">
      <component :is="menu.icon" />
    </u-icon>
    <i v-else :class="cls.e('icon-place')"></i>

    <span>{{ menu.label }}</span>
  </li>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { ContextMenuDIKey } from './di'
import type { ContextMenuItem } from '@ui/types/components/context-menu'
import { vRipple } from '@ui/directives'
import { UIcon } from '../icon'

defineOptions({
  name: 'ContextMenuItem'
})

const { menu } = defineProps<{
  menu: ContextMenuItem
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', menu: ContextMenuItem): void
}>()

const { cls } = inject(ContextMenuDIKey)!
</script>
