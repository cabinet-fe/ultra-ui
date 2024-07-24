<template>
  <div>
    <div class="config">
      <div>
        {{ currentPath }}
      </div>
      <u-checkbox v-model="config.collapsed">折叠</u-checkbox>
    </div>

    <u-menu
      :menus="menus"
      :collapsed="config.collapsed"
      :current-path="currentPath"
      @item-click="
        router.replace({
          path: route.path,
          query: {
            currentPath: $event.path
          }
        })
      "
      class="menu-wrapper"
    >
    </u-menu>
  </div>
</template>

<script setup lang="ts">
import type { UMenu } from 'ultra-ui'
import { shallowRef, reactive, computed } from 'vue'
import { HouseFilled, UserGroup, Lock, Cart } from 'icon-ultra'
import { useRoute, useRouter } from 'vue-router'

const menus = shallowRef<any[]>([
  { title: '首页', icon: HouseFilled, path: '/' },
  { title: '功能模块管理', icon: UserGroup, path: '/business-center/modules' },

  { title: '数据字典', icon: Cart, path: '/business-center/dict' },
  { title: '用户管理', icon: Cart, path: '/business-center/user' },
  { title: '单位管理', icon: Cart, path: '/business-center/unit' },
  { title: '部门管理', icon: Cart, path: '/business-center/dept' },
  { title: '编码规则', icon: Lock, path: '/business-center/code-rule' },
  {
    title: '角色管理',
    icon: Cart,
    path: '/business-center/role',
    children: [
      {
        title: '功能模块管理',
        icon: UserGroup,
        path: '/business-center/role/1'
      },
      { title: '角色管理', icon: Cart, path: '/business-center/role/2' },
      { title: '数据字典', icon: Cart, path: '/business-center/role/3' },
      {
        title: '用户管理',
        icon: Cart,
        path: '/business-center/role/4',
        children: [
          {
            title: '功能模块管理',
            icon: UserGroup,
            path: '/business-center/role/4/1'
          },
          { title: '角色管理', icon: Lock, path: '/business-center/role/4/2' },
          { title: '数据字典', icon: Cart, path: '/business-center/role/4/3' },
          { title: '用户管理', icon: Cart, path: '/business-center/role/4/4' },
          { title: '单位管理', icon: Cart, path: '/business-center/role/4/5' },
          { title: '部门管理', icon: Cart, path: '/business-center/role/4/6' },
          { title: '编码规则', icon: Lock, path: '/business-center/role/4/7' }
        ]
      },
      { title: '单位管理', icon: Cart, path: '/business-center/role/5' },
      { title: '部门管理', icon: Cart, path: '/business-center/role/6' },
      { title: '编码规则', icon: Lock, path: '/business-center/role/7' }
    ]
  }
])

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => {
  return route.query.currentPath as string
})

const config = reactive({
  collapsed: false
})
</script>

<style scoped lang="scss">
.config {
  display: flex;
  flex-direction: column;
}

.menu-wrapper {
  width: 280px;
  height: 600px;
  border: 1px solid #eee;
}
</style>
\