<template>
  <u-menu>
    <u-menu-sub>
      <template #title>
        <u-icon><Location /></u-icon>
        <span>Navigator One</span>
      </template>
      <u-menu-item>item one</u-menu-item>
    </u-menu-sub>
    <u-menu-item />
  </u-menu>
</template>

<script setup lang="ts">
import { Location } from 'icon-ultra'
</script>
