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
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-item>item one</u-menu-item>
      <u-menu-sub index="222">
        <template #title>
          <u-icon><Download /></u-icon>
          <span>次级标题</span>
        </template>
        <u-menu-item>1-1</u-menu-item>
        <u-menu-item>1-2</u-menu-item>
      </u-menu-sub>
    </u-menu-sub>
    <u-menu-item>1</u-menu-item>
    <u-menu-item>1</u-menu-item>
    <u-menu-item>1</u-menu-item>
    <u-menu-item>1</u-menu-item>
    <u-menu-item>1</u-menu-item>
    <u-menu-item>1</u-menu-item>
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
