<template>
  <div :class="cls.b">
    <div :class="cls.e('rail')">
      <DualNavApp
        v-for="app in menus"
        :key="app.path"
        :app="app"
        :active="isAppActive(app)"
        :selected="isAppSelected(app)"
        @click="handleAppClick(app)"
      />
    </div>

    <!-- <div :class="cls.e('divider')" aria-hidden="true" /> -->

    <div :class="cls.e('panel')">
      <template v-if="panelApp">
        <div :class="cls.e('panel-header')">
          <div :class="cls.e('panel-header-main')">
            <h3 :class="cls.e('panel-title')">{{ panelApp.title }}</h3>
            <p v-if="panelApp.description" :class="cls.e('description')">
              {{ panelApp.description }}
            </p>
          </div>

          <u-tip
            v-if="hasExpandableMenus"
            :content="allExpanded ? '折叠全部' : '展开全部'"
            hide-arrow
          >
            <button
              type="button"
              :class="cls.e('toggle-expand')"
              :aria-label="allExpanded ? '折叠全部' : '展开全部'"
              @click="handleToggleExpandAll"
            >
              <u-icon>
                <FolderOpened v-if="!allExpanded" />
                <Folder v-else />
              </u-icon>
            </button>
          </u-tip>
        </div>

        <div :class="cls.e('panel-body')">
          <UNav
            ref="navRef"
            :menus="panelMenus"
            :current-path="currentPath"
            :collapsed="false"
            @item-click="emit('item-click', $event)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Folder, FolderOpened } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, ref, useTemplateRef, watch } from 'vue'

import type { DualNavEmits, DualNavProps, DualNavRootItem } from '../../types/dual-nav'
import type { NavExposed, NavItem } from '../../types/nav'
import { UIcon } from '../icon'
import { UNav } from '../nav'
import { collectNavBranchPaths } from '../nav/helper'
import { UTip } from '../tip'
import DualNavApp from './dual-nav-app.vue'
import { findFirstLeaf, findRootApp } from './helper'

defineOptions({ name: 'DualNav' })

const props = defineProps<DualNavProps>()
const emit = defineEmits<DualNavEmits>()

const cls = bem('dual-nav')
const navRef = useTemplateRef<NavExposed>('navRef')

/** 右栏当前展示的应用（点击左轨或 currentPath 同步） */
const panelAppPath = ref<string>()
const allExpanded = ref(false)

function syncPanelAppFromCurrentPath(currentPath?: string) {
  const rootApp = findRootApp(props.menus, currentPath)
  if (rootApp) {
    panelAppPath.value = rootApp.path
    return
  }

  if (!panelAppPath.value && props.menus?.length) {
    panelAppPath.value = props.menus[0]!.path
  }
}

watch(
  () => [props.currentPath, props.menus] as const,
  ([currentPath]) => {
    syncPanelAppFromCurrentPath(currentPath)
  },
  { immediate: true }
)

const panelApp = computed<DualNavRootItem | undefined>(() => {
  if (!panelAppPath.value || !props.menus?.length) return undefined
  return props.menus.find((app) => app.path === panelAppPath.value)
})

/** 右栏菜单：有子级时展示子级，单层时展示根项自身 */
const panelMenus = computed<NavItem[] | undefined>(() => {
  const app = panelApp.value
  if (!app) return undefined
  if (app.children?.length) return app.children
  return [app]
})

const hasExpandableMenus = computed(() => {
  return collectNavBranchPaths(panelMenus.value).length > 0
})

watch(panelAppPath, () => {
  allExpanded.value = false
})

/** 左轨高亮：currentPath 落在该应用下时为激活态 */
function isAppActive(app: NavItem): boolean {
  return findRootApp(props.menus, props.currentPath)?.path === app.path
}

/** 左轨选中：已切换右栏但尚未导航到该应用下任一菜单时，使用 hover 风格 */
function isAppSelected(app: NavItem): boolean {
  return panelAppPath.value === app.path && !isAppActive(app)
}

function handleAppClick(app: NavItem) {
  if (app.disabled) return

  panelAppPath.value = app.path

  emit('item-click', findFirstLeaf(app))
}

function handleToggleExpandAll() {
  if (allExpanded.value) {
    navRef.value?.collapseAll()
    allExpanded.value = false
    return
  }

  navRef.value?.expandAll()
  allExpanded.value = true
}
</script>
