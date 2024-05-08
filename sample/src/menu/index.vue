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
        ref="menuRef"
        activeTextColor="#CC00FF"
        background-color="rgba(152, 251, 152, 0.2)"
        text-color="#00CCCC"
      >
        <u-menu-sub index="111" :icon="Location">
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
        <u-menu-item index="a6" :icon="Setting">一级菜单7</u-menu-item>
      </u-menu>
    </u-scroll>
  </div>
</template>

<script setup lang="ts">
import { Location, Setting } from 'icon-ultra'
import type { UMenu } from 'ultra-ui/components'
import { shallowRef, reactive, watch } from 'vue'

const open = (index: string) => {
  console.log('open', index)
}

const close = (index: string) => {
  console.log('close', index)
}

const menuRef = shallowRef<InstanceType<typeof UMenu>>()

const config = reactive({
  open: false,
  simple: false
})

watch(
  () => config.open,
  (val) => {
    val ? menuRef.value?.open('111') : menuRef.value?.close('111')
  }
)
</script>

<style scoped lang="scss">
.config {
  display: flex;
  flex-direction: column;
}

.menu-wrapper {
  border: 2px solid gold;
  height: 600px;
  overflow: auto;
}
</style>
