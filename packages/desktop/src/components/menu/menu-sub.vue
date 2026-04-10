<template>
  <li :class="[cls.e('sub'), bem.is('expanded', expanded)]">
    <div
      :class="[
        cls.e('sub-content'),
        bem.is('first-level', depth === 0),
        bem.is('expanded', expanded),
        bem.is('branch-active', branchActive)
      ]"
      @click="handleToggleExpand"
    >
      <UMenuIcon v-if="menu.icon" :icon="menu.icon" :class="cls.e('icon')" />

      <!-- 文本 -->
      <span :class="cls.e('sub-title')">
        {{ menu.title }}
      </span>

      <!-- 展开图标 -->
      <u-icon :class="[cls.e('sub-expand'), bem.is('expanded', expanded)]">
        <ArrowRight />
      </u-icon>
    </div>

    <!-- @vue-ignore -->
    <transition
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @before-leave="beforeLeave"
      @after-leave="afterLeave"
    >
      <ul :class="cls.e('sub-list')" v-show="expanded">
        <template v-for="(child, index) of menu.children!" :key="getKey(index, parentKey)">
          <UMenuItem v-if="!child.children?.length" :menu="child" :depth="depth + 1" />
          <MenuSub v-else :menu="child" :parent-key="getKey(index, parentKey)" :depth="depth + 1" />
        </template>
      </ul>
    </transition>
  </li>
</template>

<script setup lang="ts">
import { ArrowRight } from '@ultra-ui/icons/normal'
import { bem } from '@ultra-ui/utils'
import { computed, inject } from 'vue'

import type { MenuItem } from '../../types'
import { UIcon } from '../icon'
import { MenuDIKey } from './di'
import { getKey } from './helper'
import UMenuIcon from './menu-icon.vue'
import UMenuItem from './menu-item.vue'
import { useMenuTransition } from './use-menu-transition'

defineOptions({ name: 'MenuSub' })

const props = defineProps<{ menu: MenuItem; parentKey: string; depth: number }>()

const { cls, expandedPath, menuProps } = inject(MenuDIKey)!

const { enter, afterEnter, beforeLeave, leave, afterLeave } = useMenuTransition()

const expanded = computed(() => expandedPath.has(props.menu.path))

const branchActive = computed(() => {
  const currentPath = menuProps.currentPath
  if (!currentPath) return false

  const check = (items?: MenuItem[]) => {
    return items?.some((item) => item.path === currentPath || check(item.children)) ?? false
  }

  return check(props.menu.children)
})

function handleToggleExpand() {
  const { menu } = props
  expandedPath.has(menu.path) ? expandedPath.delete(menu.path) : expandedPath.add(menu.path)
}
</script>
