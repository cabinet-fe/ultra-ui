<template>
  <div>
    <u-scrollbar tag="ul" class="bar" :height="200" ref="scrollbarRef">
      <li style="width: 2000px" v-for="i of 20" :key="i">{{ i }}</li>
    </u-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { ScrollbarExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollbarExposed>()
</script>

<style lang="scss" scoped>
.bar {
  border: var(--u-border);
}
</style>
