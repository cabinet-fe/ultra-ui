<template>
  <div>
    <u-menu :menus="menus"> </u-menu>

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
        :active-index="activeIndex"
      >
        <LayoutMenu v-for="menu of menus" :menus="menu" />
      </u-menu>
    </u-scroll>
  </div>
</template>

<script setup lang="ts">
import type { UMenu } from "ultra-ui/components"
import { shallowRef, reactive, watch, ref } from "vue"
import { HouseFilled, UserGroup, Lock, Cart } from "icon-ultra"
import LayoutMenu from "./layout-menu.vue"

const menus = shallowRef<any[]>([
  { title: "首页", icon: HouseFilled, path: "/" },
  { title: "功能模块管理", icon: UserGroup, path: "/business-center/modules" },
  {
    title: "角色管理",
    icon: Cart,
    path: "/business-center/role",
    children: [
      { title: "首页", icon: HouseFilled, path: "/" },
      {
        title: "功能模块管理",
        icon: UserGroup,
        path: "/business-center/modules",
      },
      { title: "角色管理", icon: Cart, path: "/business-center/role" },
      { title: "数据字典", icon: Cart, path: "/business-center/dict" },
      {
        title: "用户管理",
        icon: Cart,
        path: "/business-center/user",
        children: [
          { title: "首页", icon: HouseFilled, path: "/" },
          {
            title: "功能模块管理",
            icon: UserGroup,
            path: "/business-center/modules",
          },
          { title: "角色管理", icon: Lock, path: "/business-center/role" },
          { title: "数据字典", icon: Cart, path: "/business-center/dict" },
          { title: "用户管理", icon: Cart, path: "/business-center/user" },
          { title: "单位管理", icon: Cart, path: "/business-center/unit" },
          { title: "部门管理", icon: Cart, path: "/business-center/dept" },
          { title: "编码规则", icon: Lock, path: "/business-center/code-rule" },
        ],
      },
      { title: "单位管理", icon: Cart, path: "/business-center/unit" },
      { title: "部门管理", icon: Cart, path: "/business-center/dept" },
      { title: "编码规则", icon: Lock, path: "/business-center/code-rule" },
    ],
  },
  { title: "数据字典", icon: Cart, path: "/business-center/dict" },
  { title: "用户管理", icon: Cart, path: "/business-center/user" },
  { title: "单位管理", icon: Cart, path: "/business-center/unit" },
  { title: "部门管理", icon: Cart, path: "/business-center/dept" },
  { title: "编码规则", icon: Lock, path: "/business-center/code-rule" },
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
  index: "/view/index",
})

const activeIndex = ref("/view/index/12322")

watch(
  () => config.open,
  (val) => {
    menuRef.value![val ? "open" : "close"](config.index)
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
