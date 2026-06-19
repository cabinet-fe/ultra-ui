<template>
  <u-scroll tag="ul" :class="[navCls.b, navCls.m(size)]" :container-class="navCls.e('container')">
    <!-- 常规 -->
    <template v-if="!collapsed">
      <template v-for="(item, index) of menus" :key="index">
        <UNavSub v-if="item.children?.length" :item="item" :parent-key="String(index)" :depth="0" />
        <UNavItem v-else :item="item" :key="index" :depth="0" />
      </template>
    </template>

    <!-- 折叠 -->
    <template v-else>
      <template v-for="(item, index) of menus" :key="index">
        <UNavSubCollapsed
          v-if="item.children?.length"
          :item="item"
          :parent-key="String(index)"
          :depth="0"
        />
        <UNavItemCollapsed v-else :item="item" :key="index" :depth="0" />
      </template>
    </template>
  </u-scroll>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem, ExpandTransition } from '@veltra/utils'
import type { ComponentSize } from '@veltra/utils'
import { computed, provide, shallowReactive, watch } from 'vue'

import type { NavEmits, NavProps } from '../../types/nav'
import { UScroll } from '../scroll'
import { NavDIKey } from './di'
import { collectNavBranchPaths } from './helper'
import UNavItemCollapsed from './nav-item-collapsed.vue'
import UNavItem from './nav-item.vue'
import UNavSubCollapsed from './nav-sub-collapsed.vue'
import UNavSub from './nav-sub.vue'
import { walkNavWithPath } from './walk-nav-path'

defineOptions({ name: 'Nav' })

const props = withDefaults(defineProps<NavProps>(), { collapsed: false })

const emit = defineEmits<NavEmits>()

const cls = bem('nav')
const collapsedCls = bem('collapsed-nav')

const navCls = computed(() => {
  return props.collapsed ? collapsedCls : cls
})

const expandTransition = new ExpandTransition({
  enterTransition:
    'height 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding-top 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  leaveTransition:
    'height 0.2s cubic-bezier(0.4, 0, 1, 1), padding-top 0.2s cubic-bezier(0.4, 0, 1, 1), padding-bottom 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s cubic-bezier(0.4, 0, 1, 1)',
  opacity: true
})

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const expandedPath = shallowReactive(new Set<string>())

watch(
  [() => props.currentPath, () => props.menus],
  ([currentPath, menus]) => {
    if (!currentPath || !menus) return
    menus.forEach((menu) => {
      walkNavWithPath(menu, (node, nodePath) => {
        if (node.path === currentPath) {
          nodePath.slice(0, -1).forEach((path) => {
            expandedPath.add(path.path)
          })
          return false
        }
      })
    })
  },
  { immediate: true }
)

provide(NavDIKey, {
  cls,
  collapsedCls,
  navProps: props,
  navEmit: emit,
  expandedPath,
  size,
  expandTransition
})

function expandAll() {
  collectNavBranchPaths(props.menus).forEach((path) => {
    expandedPath.add(path)
  })
}

function collapseAll() {
  expandedPath.clear()
}

defineExpose({ expandAll, collapseAll })
</script>
