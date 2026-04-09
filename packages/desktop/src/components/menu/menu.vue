<template>
  <u-scroll
    tag="ul"
    :class="[menuCls.b, menuCls.m(size)]"
    :container-class="menuCls.e('container')"
  >
    <!-- 常规 -->
    <template v-if="!collapsed">
      <template v-for="(menu, index) of menus" :key="index">
        <UMenuSub
          v-if="menu.children?.length"
          :menu="menu"
          :parent-key="String(index)"
          :depth="0"
        />
        <UMenuItem v-else :menu="menu" :key="index" :depth="0" />
      </template>
    </template>

    <!-- 折叠 -->
    <template v-else>
      <template v-for="(menu, index) of menus" :key="index">
        <UMenuSubCollapsed
          v-if="menu.children?.length"
          :menu="menu"
          :parent-key="String(index)"
          :depth="0"
        />
        <UMenuItemCollapsed v-else :menu="menu" :key="index" :depth="0" />
      </template>
    </template>
  </u-scroll>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@ultra-ui/compositions'
import { bem } from '@ultra-ui/utils'
import { computed, provide, shallowReactive, watch } from 'vue'

import type { MenuEmits, MenuProps, ComponentSize } from '../../types'
import { UScroll } from '../scroll'
import { MenuDIKey } from './di'
import UMenuItemCollapsed from './menu-item-collapsed.vue'
import UMenuItem from './menu-item.vue'
import UMenuSubCollapsed from './menu-sub-collapsed.vue'
import UMenuSub from './menu-sub.vue'
import { walkMenuWithPath } from './walk-menu-path'

defineOptions({
  name: 'Menu'
})

const props = withDefaults(defineProps<MenuProps>(), {
  expand: false,
  activeIndex: '',
  collapsed: false,
  uniqueOpened: false
})

const emit = defineEmits<MenuEmits>()

const cls = bem('menu')
const collapsedCls = bem('collapsed-menu')

const menuCls = computed(() => {
  return props.collapsed ? collapsedCls : cls
})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const expandedPath = shallowReactive(new Set<string>())

watch(
  [() => props.currentPath, () => props.menus],
  ([currentPath, menus]) => {
    if (!currentPath || !menus) return
    menus.forEach((menu) => {
      walkMenuWithPath(menu, (node, nodePath) => {
        if (node.path === currentPath) {
          nodePath.slice(0, -1).forEach((path) => {
            expandedPath.add(path.path)
          })
          return false
        }
      })
    })
  },
  {
    immediate: true
  }
)

provide(MenuDIKey, {
  cls,
  collapsedCls,
  menuProps: props,
  menuEmit: emit,
  expandedPath,
  size
})
</script>
