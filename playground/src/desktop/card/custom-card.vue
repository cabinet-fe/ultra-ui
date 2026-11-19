<template>
  <u-card class="custom-card">
    <u-card-header v-if="title"> {{ title }} </u-card-header>

    <u-card-content :style="{ height, overflow: 'auto' }">
      <slot />
    </u-card-content>
  </u-card>
</template>

<script lang="ts" setup>
import { UCard, UCardContent, UCardHeader } from '@veltra/desktop'
defineProps<{ title?: string; height?: string }>()
</script>

<style lang="scss" scoped>
.custom-card {
  margin-bottom: 20px;
}
</style>
