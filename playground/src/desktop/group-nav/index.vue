<template>
  <div class="demo">
    <div class="demo-info">
      <div>当前路径：{{ currentPath || '（未选择）' }}</div>
      <div class="demo-hint">groups 为分组列表；每组 children 仅作一层叶子渲染，更深嵌套舍弃。</div>
    </div>

    <u-group-nav
      class="group-nav-wrapper"
      :groups="groups"
      :current-path="currentPath"
      @item-click="handleItemClick"
    />
  </div>
</template>

<script setup lang="ts">
import type { GroupNavGroup, NavItem } from '@veltra/desktop'
import { Cart, HouseFilled, Lock, Setting } from '@veltra/icons/normal'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.query.currentPath as string | undefined)

const groups = shallowRef<GroupNavGroup[]>([
  { title: '概览', children: [{ title: '首页', icon: HouseFilled, path: '/group-nav/home' }] },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/group-nav/business/modules' },
      { title: '数据字典', icon: Cart, path: '/group-nav/business/dict' },
      {
        title: '角色管理',
        icon: Lock,
        path: '/group-nav/business/role',
        // 更深 children 会被舍弃，本项仍作为叶子展示
        children: [
          { title: '角色列表', path: '/group-nav/business/role/list' },
          { title: '权限配置', path: '/group-nav/business/role/permission' }
        ]
      }
    ]
  },
  { title: '帮助', children: [{ title: '使用帮助', icon: Cart, path: '/group-nav/help' }] },
  {
    title: '系统设置',
    children: [
      { title: '基础设置', icon: Setting, path: '/group-nav/settings/basic' },
      { title: '安全设置', icon: Lock, path: '/group-nav/settings/security', disabled: true }
    ]
  }
])

function handleItemClick(item: NavItem) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<style scoped lang="scss">
@use 'pkg:@veltra/styles/functions' as fn;

.demo {
  padding: 12px;
}

.demo-info {
  margin-bottom: 12px;
  color: fn.use-var(text-color, second);
}

.demo-hint {
  margin-top: 6px;
  font-size: fn.use-var(font-size-assist, default);
  line-height: 1.5;
}

.group-nav-wrapper {
  width: 260px;
  height: 480px;
  box-shadow: fn.use-var(shadow);
}
</style>
