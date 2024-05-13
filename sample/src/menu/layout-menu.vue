<template>
  <div v-if="menus.children?.length">
    <u-menu-sub :index="menus.path" :icon="menus.icon">
      <template #title>
        <span>{{ menus.title }}</span>
      </template>
      <layout-menu v-for="subMenuItem of menus.children" :menus="subMenuItem" />
    </u-menu-sub>
  </div>

  <div v-else>
    <u-menu-item :index="menus.path" :icon="menus.icon"
      >{{ menus.title }}
    </u-menu-item>
  </div>
</template>

<script setup lang="ts">
import LayoutMenu from "./layout-menu.vue"
defineProps({
  menus: {
    type: Object as () => any,
    required: true,
  },
})
</script>

<script lang="ts">
export default {
  name: "LayoutMenu",
  inheritAttrs: false,
}
</script>
