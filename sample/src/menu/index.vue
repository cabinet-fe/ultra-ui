<template>
  <div>
    <div class="config">
      <u-checkbox v-model="config.open">open sub menu</u-checkbox>
      <u-checkbox v-model="config.simple">simple mode</u-checkbox>
    </div>
    <u-scroll class="menu-wrapper">
      <u-menu :expand="false" @open="open" @close="close" ref="menuRef">
        <u-menu-sub index="111" :icon="Location">
          <template #title>
            <span>Navigator One</span>
          </template>
          <u-menu-item index="a">item one</u-menu-item>
          <u-menu-item index="b">item one</u-menu-item>
          <u-menu-item index="c" disabled>item one</u-menu-item>
          <u-menu-item index="d">item one</u-menu-item>
          <u-menu-item index="e" :icon="Setting">item one</u-menu-item>
          <u-menu-item index="f">item one</u-menu-item>
          <u-menu-item index="g">item one</u-menu-item>
          <u-menu-sub index="222" :icon="Setting">
            <template #title>
              <span>次级标题</span>
            </template>
            <u-menu-item index="1-1">1-1</u-menu-item>
            <u-menu-item index="1-2">1-2</u-menu-item>
          </u-menu-sub>
        </u-menu-sub>
        <u-menu-item index="a1">1</u-menu-item>
        <u-menu-item index="a2" :icon="Setting">1</u-menu-item>
        <u-menu-item index="a3">1</u-menu-item>
        <u-menu-item index="a4">1</u-menu-item>
        <u-menu-item index="a5">1</u-menu-item>
        <u-menu-item index="a6">1</u-menu-item>
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

watch(() => config.open, (val) => {
  val ? menuRef.value?.open('111') : menuRef.value?.close('111')
})
</script>

<style scoped lang="scss">
.config {
  display: flex;
  flex-direction: column;
}

.menu-wrapper {
  border: 1px solid gold;
  width: 300px;
  height: 600px;
  overflow: auto;
}
</style>