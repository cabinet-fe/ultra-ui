<template>
  <div>
    <div class="config">
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
      >
        <LayoutMenu v-for="menu of menus" :menus="menu" />
        <!-- <u-menu-sub index="111" :icon="Location">
          <template #title>
            <span>一级菜单1</span>
          </template>
          <u-menu-item index="a">二级菜单1</u-menu-item>
          <u-menu-item index="b">二级菜单2</u-menu-item>
          <u-menu-item index="c" disabled>二级菜单3</u-menu-item>
          <u-menu-item index="d">二级菜单4</u-menu-item>
          <u-menu-item index="e" :icon="Setting">二级菜单5</u-menu-item>
          <u-menu-item index="f">二级菜单6</u-menu-item>
          <u-menu-item index="g">二级菜单7</u-menu-item>
          <u-menu-sub index="222" :icon="Setting">
            <template #title>
              <span>二级菜单8</span>
            </template>
            <u-menu-item index="1-1">三级菜单1</u-menu-item>
            <u-menu-item index="1-2">三级菜单2</u-menu-item>
          </u-menu-sub>
        </u-menu-sub>
        <u-menu-item index="a1" :icon="Setting">一级菜单2</u-menu-item>
        <u-menu-sub index="a2" :icon="Setting" disabled>
          <template #title>一级菜单3</template>
          <u-menu-item index="a21">二级菜单1</u-menu-item>
          <u-menu-item index="a22">二级菜单1</u-menu-item>
          <u-menu-item index="a23">二级菜单1</u-menu-item>
        </u-menu-sub>
        <u-menu-item index="a3" :icon="Setting">一级菜单4</u-menu-item>
        <u-menu-item index="a4" :icon="Setting">一级菜单5</u-menu-item>
        <u-menu-item index="a5" :icon="Setting" disabled>一级菜单6</u-menu-item>
        <u-menu-item index="a6" :icon="Setting">一级菜单7</u-menu-item> -->
      </u-menu>
    </u-scroll>
  </div>
</template>

<script setup lang="ts">
import type { UMenu } from "ultra-ui/components"
import { shallowRef, reactive, watch } from "vue"
import { Layers, HouseFilled, Usergroup, Lock, Cart } from "icon-ultra"
import LayoutMenu from "./layout-menu.vue"

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
  open: true,
  simple: true,
})

watch(
  () => config.open,
  (val) => {
    val ? menuRef.value?.open("111") : menuRef.value?.close("111")
  }
)
</script>

<style scoped lang="scss">
.config {
  display: flex;
  flex-direction: column;
}

.menu-wrapper {
  width: 60px;
  border: 2px solid gold;
  height: 600px;
  overflow: auto;
}
</style>
