<template>
  <div>
    <div>
      <u-button @click="handleOpen" type="primary">open</u-button>
      <u-button @click="handleClose" type="primary">close</u-button>
    </div>
    <u-menu :expand="false" @open="open" @close="close" ref="menuRef">
    <u-menu-sub index="111">
      <template #title>
        <u-icon><Location /></u-icon>
        <span>Navigator One</span>
      </template>
      <u-menu-item index="a">item one</u-menu-item>
      <u-menu-item index="b">item one</u-menu-item>
      <u-menu-item index="c" disabled>item one</u-menu-item>
      <u-menu-item index="d">item one</u-menu-item>
      <u-menu-item index="e">item one</u-menu-item>
      <u-menu-item index="f">item one</u-menu-item>
      <u-menu-item index="g">item one</u-menu-item>
      <u-menu-sub index="222" disabled>
        <template #title>
          <u-icon><Download /></u-icon>
          <span>次级标题</span>
        </template>
        <u-menu-item index="1-1">1-1</u-menu-item>
        <u-menu-item index="1-2">1-2</u-menu-item>
      </u-menu-sub>
    </u-menu-sub>
    <u-menu-item index="a1">1</u-menu-item>
    <u-menu-item index="a2">1</u-menu-item>
    <u-menu-item index="a3">1</u-menu-item>
    <u-menu-item index="a4">1</u-menu-item>
    <u-menu-item index="a5">1</u-menu-item>
    <u-menu-item index="a6">1</u-menu-item>
  </u-menu>
  </div>
</template>

<script setup lang="ts">
import { Location, Download } from 'icon-ultra'
import type { UMenu } from 'ultra-ui/components'
import { shallowRef } from 'vue'

const open = (index: string) => {
  console.log('open', index)
}

const close = (index: string) => {
  console.log('close', index)
}

const menuRef = shallowRef<InstanceType<typeof UMenu>>()

const handleOpen = () => {
  menuRef.value?.open('111')
}

const handleClose = () => {
  menuRef.value?.close('111')
}
</script>
