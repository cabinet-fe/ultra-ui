<template>
  <div>
    <u-scroll tag="ul" class="bar" :height="200" ref="scrollbarRef">
      {{ c.log(123) }}
      <li style="width: 2000px" v-for="i of 200" :key="i">{{ i }}</li>
    </u-scroll>
  </div>
</template>

<script lang="ts" setup>
import { ScrollExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()
</script>

<style lang="scss" scoped>
.bar {
  border: var(--u-border);
}
</style>
