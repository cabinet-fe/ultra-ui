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
import type { MenuEmits, MenuProps, ComponentSize } from '@ui/types'
import { bem } from '@ui/utils'
import { computed, provide, shallowReactive, watch } from 'vue'
import { MenuDIKey } from './di'
import { useFallbackProps } from '@ui/compositions'
import UMenuSub from './menu-sub.vue'
import UMenuItem from './menu-item.vue'
import UMenuSubCollapsed from './menu-sub-collapsed.vue'
import UMenuItemCollapsed from './menu-item-collapsed.vue'
import { UScroll } from '../scroll'
import { Forest, TreeNode, Tree } from 'cat-kit/fe'
import { MenuNode } from './menu-node'

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

const menuForest = computed(() => {
  return props.menus ? Forest.create(props.menus, MenuNode) : null
})

watch(
  [() => props.currentPath, () => menuForest.value],
  ([currentPath, menuForest]) => {
    if (!currentPath || !menuForest) return
    menuForest.dft(item => {
      if (item.data.path === currentPath) {
        let parent = item.parent
        while (parent?.data?.path) {
          expandedPath.add(parent.data.path)
          parent = parent.parent
        }
        return false
      }
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
