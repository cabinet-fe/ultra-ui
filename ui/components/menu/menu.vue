<template>
  <u-scroll
    tag="ul"
    :class="[cls.b, cls.m(size), bem.is('collapsed', collapsed)]"
  >
    <template v-if="!collapsed">
      <template v-for="(menu, index) of menus" :key="String(index)">
        <UMenuSub
          v-if="menu.children?.length"
          :menu="menu"
          :parent-key="String(index)"
          :depth="0"
        />
        <UMenuItem v-else :menu="menu" :key="String(index)" :depth="0" />
      </template>
    </template>
  </u-scroll>
</template>

<script lang="ts" setup>
import type { MenuEmits, MenuProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { computed, nextTick, provide, shallowReactive, watch } from 'vue'
import { MenuDIKey } from './di'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import UMenuSub from './menu-sub.vue'
import UMenuItem from './menu-item.vue'
import { UScroll } from '../scroll'
import { Forest, TreeNode } from 'cat-kit/fe'

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

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const expandedPath = shallowReactive(new Set<string>())

class MenuNode<Data extends Record<string, any>> extends TreeNode<Data> {
  override parent: MenuNode<Data> | null = null
  override children?: MenuNode<Data>[]
}
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
  menuProps: props,
  menuEmit: emit,
  expandedPath
})
</script>
