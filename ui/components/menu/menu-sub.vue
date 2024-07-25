<template>
  <li :class="cls.e('sub')">
    <div
      v-if="!menuProps.collapsed"
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

    <!-- 收缩 -->
    <template v-else>
      <u-tip :direction="direction" :alignment="alignment" :trigger="trigger">
        <div
          :class="cls.e('sub-content')"
          @mouseenter="handleToggleExpand"
          :style="{
            paddingLeft: 8 + depth * 20 + 'px'
          }"
        >
          <!-- 图标 -->
          <div>
            <template v-if="menu.icon">
              <u-icon
                :class="cls.e('sub-icon')"
                v-if="typeof menu.icon !== 'string'"
              >
                <component :is="menu.icon" />
              </u-icon>

              <img
                :src="menu.icon"
                v-else
                :class="cls?.e('sub-icon')"
                alt="icon"
              />
            </template>
            <template v-if="!menuProps.collapsed || depth !== 0">
              <!-- 文本 -->
              <span :class="cls.e('sub-title')">
                {{ menu.title }}
              </span>

              <!-- 展开图标 -->
              <u-icon
                :class="[cls.e('sub-expand'), bem.is('expanded', expanded)]"
              >
                <ArrowRight />
              </u-icon>
            </template>
          </div>
        </div>
        <template #content>
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
        </template>
      </u-tip>
    </template>

    <!-- @vue-ignore -->
    <transition
      v-if="!menuProps.collapsed"
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
import { computed, inject, shallowRef } from 'vue'
import { MenuDIKey } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuItem } from '@ui/types/components/menu'
import UMenuItem from './menu-item.vue'
import { getKey } from './helper'
import { useMenuTransition } from './use-menu-transition'
import { bem } from '@ui/utils'
import type { TipAlign, TipDirection } from '@ui/types'

defineOptions({
  name: 'MenuSub'
})

const props = defineProps<{
  menu: MenuItem
  parentKey: string
  depth: number
  collapsed?: boolean
}>()

const { cls, expandedPath, menuProps } = inject(MenuDIKey)!

const { enter, afterEnter, beforeLeave, leave, afterLeave } =
  useMenuTransition()

const expanded = computed(() => expandedPath.has(props.menu.path))

const direction = shallowRef<TipDirection>('right')
const alignment = shallowRef<TipAlign>('center')
const trigger = shallowRef<'hover' | 'click'>('hover')

function handleToggleExpand(e) {
  const { menu } = props
  expandedPath.has(menu.path)
    ? expandedPath.delete(menu.path)
    : expandedPath.add(menu.path)
}
</script>
