<template>
  <div class="demo">
    <div class="demo-info">
      <div>当前路径：{{ currentPath || '（未选择）' }}</div>
      <label class="demo-toggle">
        <input v-model="labeled" type="checkbox" />
        labeled 左轨（图标 + 名称）
      </label>
    </div>

    <u-dual-nav
      class="dual-nav-wrapper"
      :menus="menus"
      :current-path="currentPath"
      :rail-variant="labeled ? 'labeled' : 'icon'"
      @item-click="handleItemClick"
    />
  </div>
</template>

<script setup lang="ts">
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { Cart, HouseFilled, Lock, Setting, UserGroup } from '@veltra/icons/normal'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.query.currentPath as string | undefined)
const labeled = shallowRef(false)

const menus = shallowRef<DualNavRootItem[]>([
  {
    title: '工作台',
    icon: HouseFilled,
    path: '/dual-nav/home',
    description: '个人工作台与常用快捷入口'
  },
  {
    title: '业务中心',
    icon: UserGroup,
    path: '/dual-nav/business',
    description: '业务模块、数据与权限管理',
    children: [
      { title: '功能模块', path: '/dual-nav/business/modules' },
      { title: '数据字典', icon: Cart, path: '/dual-nav/business/dict' },
      {
        title: '角色管理',
        icon: Lock,
        path: '/dual-nav/business/role',
        children: [
          { title: '角色列表', path: '/dual-nav/business/role/list' },
          { title: '权限配置', path: '/dual-nav/business/role/permission' }
        ]
      }
    ]
  },
  {
    title: '系统设置',
    icon: Setting,
    path: '/dual-nav/settings',
    description: '系统参数与安全策略配置',
    children: [
      { title: '基础设置', path: '/dual-nav/settings/basic' },
      { title: '安全设置', path: '/dual-nav/settings/security' }
    ]
  },
  { title: '帮助文档', icon: Cart, path: '/dual-nav/help', description: '产品使用说明与常见问题' }
])

function handleItemClick(item: DualNavRootItem | NavItem) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<style scoped lang="scss">
@use 'pkg:@veltra/styles/functions' as fn;

.demo {
  padding: 12px;
}

.demo-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-bottom: 12px;
  color: fn.use-var(text-color, second);
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.dual-nav-wrapper {
  width: 320px;
  height: 480px;
  box-shadow: fn.use-var(shadow);
}
</style>
