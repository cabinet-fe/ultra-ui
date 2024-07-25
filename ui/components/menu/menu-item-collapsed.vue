<template>
  <u-tip direction="right" alignment="center" trigger="hover">
    <li
      :class="[
        cls.e('item'),
        bem.is('active', active),
        bem.is('disabled', menu.disabled ?? false)
      ]"
      v-ripple="!menu.disabled ? cls.e('ripple') : false"
      :style="{
        paddingLeft: `${depth * 20 + 8}px`
      }"
      ref="itemRef"
      @click="menuEmit('item-click', menu)"
    >
      <!-- 收缩 -->
      <template v-if="menu.icon">
        <u-icon
          :class="cls.e('item-icon')"
          v-if="typeof menu.icon !== 'string'"
        >
          <component :is="menu.icon" />
        </u-icon>

        <img :src="menu.icon" v-else :class="cls?.e('item-icon')" alt="icon" />
      </template>

      <span :class="cls.e('item-expand')" v-if="depth !== 0">{{
        menu.title
      }}</span>
    </li>

    <template #content>
      {{ menu.title }}
    </template>
  </u-tip>
</template>

<script setup lang="ts">
import { computed, inject, shallowRef, watch } from 'vue'
import { MenuDIKey } from './di'
import type { MenuItem } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'MenuItem'
})

const props = defineProps<{
  menu: MenuItem
  depth: number
}>()

const { cls, menuProps, menuEmit } = inject(MenuDIKey)!

const itemRef = shallowRef<HTMLElement>()

const active = computed(() => {
  return menuProps.currentPath === props.menu.path
})

watch([active, itemRef], ([active, itemRef]) => {
  active &&
    itemRef &&
    itemRef.scrollIntoView({
      block: 'nearest'
    })
})
</script>
