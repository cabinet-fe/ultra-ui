<template>
  <!-- <div> -->
  <div>
    <u-tip
      v-if="depth === 0"
      direction="right"
      alignment="center"
      :trigger="trigger"
      ref="tipRef"
      hide-arrow
    >
      <li
        :class="[
          cls.e('item'),
          bem.is('active', active),
          bem.is('disabled', menu.disabled ?? false)
        ]"
        v-ripple="!menu.disabled ? cls.e('ripple') : false"
        ref="itemRef"
        @click="handleMenuItemClick(menu)"
      >
        <!-- 收缩 -->
        <template v-if="menu.icon">
          <u-icon
            :class="cls.e('item-icon')"
            v-if="typeof menu.icon !== 'string'"
          >
            <component :is="menu.icon" />
          </u-icon>

          <img
            :src="menu.icon"
            v-else
            :class="cls?.e('item-icon')"
            alt="icon"
          />
        </template>

        <span :class="cls.e('item-expand')" v-if="depth !== 0">
          {{ menu.title }}
        </span>
      </li>

      <template #content>
        {{ menu.title }}
      </template>
    </u-tip>

    <li
      v-else
      :class="[
        cls.e('item'),
        bem.is('active', active),
        bem.is('disabled', menu.disabled ?? false)
      ]"
      v-ripple="!menu.disabled ? cls.e('ripple') : false"
      ref="itemRef"
      @click="handleMenuItemClick(menu)"
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

      <span :class="cls.e('item-expand')" v-if="depth !== 0">
        {{ menu.title }}
      </span>
    </li>
  </div>
  <!-- </div> -->
</template>

<script setup lang="ts">
import { computed, inject, shallowRef, watch } from 'vue'
import { MenuDIKey } from './di'
import type { MenuItem } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'
import { UTip } from '../tip'
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

const trigger = shallowRef<'hover' | 'click'>('hover')

const tipRef = shallowRef()

const handleMenuItemClick = (menu: MenuItem) => {
  menuEmit('item-click', menu)
}

// watch(
//   () => props.depth,
//   val => {
//     console.log(val, 'val')
//   }
// )
</script>
