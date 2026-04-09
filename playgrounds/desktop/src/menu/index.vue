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
      @item-click="router.replace({ path: route.path, query: { currentPath: $event.path } })"
      class="menu-wrapper"
    >
    </u-menu>
  </div>
</template>

<script setup lang="ts">
import { Cart, HouseFilled, Lock, UserGroup } from '@ultra-ui/icons/normal'
import { shallowRef, ref, reactive, computed } from 'vue'
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

const menus1 = ref([
  {
    id: '1',
    title: '首页',
    icon: '🏠',
    expanded: false
  },
  {
    id: '2',
    title: '产品管理',
    icon: '📦',
    expanded: false,
    children: [
      {
        id: '2-1',
        title: '产品列表',
        icon: '📝'
      },
      {
        id: '2-2',
        title: '分类管理',
        icon: '🏷️',
        children: [
          {
            id: '2-2-1',
            title: '主分类',
            icon: '📁'
          },
          {
            id: '2-2-2',
            title: '子分类',
            icon: '📂',
            children: [
              {
                id: '2-2-2-1',
                title: '电子产品',
                icon: '💻'
              },
              {
                id: '2-2-2-2',
                title: '服装鞋帽',
                icon: '👕'
              }
            ]
          }
        ]
      },
      {
        id: '2-3',
        title: '库存管理',
        icon: '📊'
      }
    ]
  },
  {
    id: '3',
    title: '用户管理',
    icon: '👥',
    expanded: false,
    children: [
      {
        id: '3-1',
        title: '用户列表',
        icon: '👤'
      },
      {
        id: '3-2',
        title: '权限管理',
        icon: '🔐',
        badge: 'New'
      }
    ]
  },
  {
    id: '4',
    title: '系统设置',
    icon: '⚙️',
    expanded: false,
    children: [
      {
        id: '4-1',
        title: '基础设置',
        icon: '🔧'
      },
      {
        id: '4-2',
        title: '高级设置',
        icon: '🛠️',
        children: [
          {
            id: '4-2-1',
            title: '安全设置',
            icon: '🔒'
          },
          {
            id: '4-2-2',
            title: '性能优化',
            icon: '⚡'
          }
        ]
      }
    ]
  },
  {
    id: '5',
    title: '帮助中心',
    icon: '❓'
  }
])
</script>

<style scoped lang="scss">
@use 'pkg:@ultra-ui/styles/functions' as fn;

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
