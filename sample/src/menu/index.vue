<template>
  <div class="cc">
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
      :style="{ width: config.collapsed ? '64px' : '260px' }"
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
            path: '/business-center/role/4/1',
            children: [
              {
                title: '角色管理',
                icon: Lock,
                path: '/business-center/role/4/4/1'
              },
              {
                title: '数据字典',
                icon: Cart,
                path: '/business-center/role/4/4/2'
              },
              {
                title: '用户管理',
                icon: Cart,
                path: '/business-center/role/4/4/3'
              },
              {
                title: '单位管理',
                icon: Cart,
                path: '/business-center/role/4/4/4'
              },
              {
                title: '部门管理',
                icon: Cart,
                path: '/business-center/role/4/4/5'
              },
              {
                title: '编码规则',
                icon: Lock,
                path: '/business-center/role/4/4/6'
              }
            ]
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
@use '@ui/styles/functions' as fn;

.config {
  display: flex;
  flex-direction: column;
}

.cc {
  padding: 12px;
  background: url(http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg)
    no-repeat center center / cover;
  color: #fff;
}

.menu-wrapper {
  transition: width 0.25s;
  height: 600px;
  border-radius: 1rem;
  box-shadow: fn.use-var(shadow);
}
</style>
