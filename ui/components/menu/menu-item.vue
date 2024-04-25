<template>
  <div :class="cls?.e('item')">
    <slot>u-menu-item</slot>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { MenuDIKey } from './di'

const injected = inject(MenuDIKey)
const { cls } = injected || {}
</script>