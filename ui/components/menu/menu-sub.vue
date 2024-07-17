<template>
  <li :class="cls.e('sub')">
    <div
      :class="cls.e('sub-content')"
      @click="handleToggleExpand"
      :style="{
        paddingLeft: 8 + depth * 20 + 'px'
      }"
    >
      <!-- 图标 -->
      <template v-if="menu.icon">
        <u-icon :class="cls.e('sub-icon')" v-if="typeof menu.icon !== 'string'">
          <component :is="menu.icon" />
        </u-icon>

        <img :src="menu.icon" v-else :class="cls?.e('sub-icon')" alt="icon" />
      </template>

      <template v-if="!menuProps.collapsed || depth !== 0">
        <!-- 文本 -->
        <span :class="cls.e('sub-title')">
          {{ menu.title }}
        </span>

        <!-- 展开图标 -->
        <u-icon :class="[cls.e('sub-expand'), bem.is('expanded', expanded)]">
          <ArrowRight />
        </u-icon>
      </template>
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
        <template
          v-for="(child, index) of menu.children!"
          :key="getKey(index, parentKey)"
        >
          <UMenuItem
            v-if="!child.children?.length"
            :menu="child"
            :depth="depth + 1"
          />
          <MenuSub
            v-else
            :menu="child"
            :parent-key="getKey(index, parentKey)"
            :depth="depth + 1"
          />
        </template>
      </ul>
    </transition>
  </li>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { MenuDIKey } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuItem } from '@ui/types/components/menu'
import UMenuItem from './menu-item.vue'
import { getKey } from './helper'
import { useMenuTransition } from './use-menu-transition'
import { bem } from '@ui/utils'

defineOptions({
  name: 'MenuSub'
})

const props = defineProps<{
  menu: MenuItem
  parentKey: string
  depth: number
}>()

const { cls, expandedPath, menuProps } = inject(MenuDIKey)!

const { enter, afterEnter, beforeLeave, leave, afterLeave } =
  useMenuTransition()

const expanded = computed(() => expandedPath.has(props.menu.path))

function handleToggleExpand() {
  const { menu } = props
  expandedPath.has(menu.path)
    ? expandedPath.delete(menu.path)
    : expandedPath.add(menu.path)
}
</script>
