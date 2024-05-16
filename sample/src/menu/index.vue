<template>
  <div>
    <div class="config">
      <u-input v-model="config.index"></u-input>
      <u-checkbox v-model="config.open">open sub menu</u-checkbox>
      <u-checkbox v-model="config.simple">simple mode</u-checkbox>
    </div>
    <u-scroll class="menu-wrapper">
      <u-menu
        :expand="false"
        :simple="config.simple"
        @open="open"
        @close="close"
        @select="select"
        ref="menuRef"
        activeTextColor="#CC00FF"
        text-color="#00CCCC"
        active-index="/view/index/12322"
      >
        <LayoutMenu
          v-for="menu of menus"
          :menus="menu"
        />
      </u-menu>
    </u-scroll>
  </div>
</template>

<script setup lang="ts">
import type { UMenu } from 'ultra-ui/components'
import { shallowRef, reactive, watch } from 'vue'
import { Layers, HouseFilled, Usergroup, Lock, Cart } from 'icon-ultra'
import LayoutMenu from './layout-menu.vue'

const menus = shallowRef<any[]>([
  { title: "首页", icon: HouseFilled, path: "/" },
  {
    title: "用户管理",
    icon: Layers,
    path: "/view/index",
    children: [
      { title: "用户管理1", icon: HouseFilled, path: "/view/index/1232" },
      { title: "用户管理2", icon: Layers, path: "/view/index/123" },
      { title: "用户管理3", icon: Usergroup, path: "/view/index/12322" },
      { title: "用户管理4", icon: Lock, path: "/view/index/123555" },
      {
        title: "用户管理5",
        icon: Cart,
        path: "/view/index/444",
        children: [
          { title: "用户管理1", icon: HouseFilled, path: "/view/index/1232" },
          { title: "用户管理2", icon: Layers, path: "/view/index/123" },
          { title: "用户管理3", icon: Usergroup, path: "/view/index/12322" },
          { title: "用户管理4", icon: Lock, path: "/view/index/123555" },
          { title: "用户管理5", icon: Cart, path: "/view/index/444" },
        ],
      },
    ],
  },
  { title: "角色管理", icon: Usergroup, path: "/view/test" },
  { title: "权限管理", icon: Lock, path: "/permission" },
  { title: "商品管理", icon: Cart, path: "/goods" },
])

const open = (index: string) => {
  console.log("open", index)
}

const close = (index: string) => {
  console.log("close", index)
}

const select = (index: string) => {
  console.log("select", index)
}

const menuRef = shallowRef<InstanceType<typeof UMenu>>()

const config = reactive({
  open: false,
  simple: false,
  index: '/view/index'
})

watch(
  () => config.open,
  (val) => {
    menuRef.value![val?'open':'close'](config.index)
  }
)
</script>

<style scoped lang="scss">
.config {
  display: flex;
  flex-direction: column;
}

.menu-wrapper {
  width: 600px;
  border: 2px solid gold;
  height: 600px;
  overflow: auto;
}
</style>
