<template>
  <li :class="cls.e('sub')">
    <div
      :class="[
        cls.e('sub-content'),
        bem.is('first-level', depth === 0),
        bem.is('expanded', expanded),
        bem.is('branch-active', branchActive)
      ]"
      @click="handleToggleExpand"
    >
      <UNavIcon v-if="item.icon" :icon="item.icon" :class="cls.e('icon')" />

      <!-- 文本 -->
      <span :class="cls.e('sub-title')">
        {{ item.title }}
      </span>

      <!-- 展开图标 -->
      <u-icon :class="[cls.e('sub-expand'), bem.is('expanded', expanded)]">
        <ArrowRight />
      </u-icon>
    </div>

    <div ref="wrapperEl" :aria-hidden="expanded ? undefined : 'true'">
      <ul :class="[cls.e('sub-list'), bem.is('has-active', branchActive)]">
        <template v-for="(child, index) of item.children!" :key="getKey(index, parentKey)">
          <UNavItem v-if="!child.children?.length" :item="child" :depth="depth + 1" />
          <NavSub v-else :item="child" :parent-key="getKey(index, parentKey)" :depth="depth + 1" />
        </template>
      </ul>
    </div>
  </li>
</template>

<script setup lang="ts">
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { NavItem } from '../../types'
import { UIcon } from '../icon'
import { NavDIKey } from './di'
import { getKey } from './helper'
import UNavIcon from './nav-icon.vue'
import UNavItem from './nav-item.vue'

defineOptions({ name: 'UNavSub' })

const props = defineProps<{ item: NavItem; parentKey: string; depth: number }>()

const { cls, expandedPath, navProps, expandTransition } = inject(NavDIKey)!

const expanded = computed(() => expandedPath.has(props.item.path))

const wrapperEl = ref<HTMLElement>()

onMounted(() => {
  if (!wrapperEl.value) return
  expandTransition.setExpanded(wrapperEl.value, expanded.value)
})

watch(expanded, (open) => {
  if (!wrapperEl.value) return
  if (open) expandTransition.expand(wrapperEl.value)
  else expandTransition.collapse(wrapperEl.value)
})

onBeforeUnmount(() => {
  if (!wrapperEl.value) return
  expandTransition.cancel(wrapperEl.value)
})

const branchActive = computed(() => {
  const currentPath = navProps.currentPath
  if (!currentPath) return false

  const check = (items?: NavItem[]) => {
    return items?.some((item) => item.path === currentPath || check(item.children)) ?? false
  }

  return check(props.item.children)
})

function handleToggleExpand() {
  const { item } = props
  expandedPath.has(item.path) ? expandedPath.delete(item.path) : expandedPath.add(item.path)
}
</script>
