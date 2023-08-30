<template>
  <div>
    <div>普通滚动</div>
    <u-scroll tag="ul" class="bar" height="200" ref="scrollbarRef">
      <li style="width: 2000px" v-for="i of 200" :key="i">
        {{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}
      </li>
    </u-scroll>

    <div>虚拟滚动</div>
    <u-virtual-scroll
      class="bar"
      :data="data"
      height="400"
      tag="ul"
      #default="{ item }"
    >
      <list-item :item="item" />
    </u-virtual-scroll>
  </div>
</template>

<script lang="ts" setup>
import { ScrollExposed } from 'ultra-ui'
import { shallowRef } from 'vue'
import ListItem from './list-item.vue'

const scrollbarRef = shallowRef<ScrollExposed>()

const data = Array.from({ length: 1000 }).map((_, i) => {
  return {
    name: 'name' + i,
    id: i
  }
})
</script>

<style lang="scss" scoped>
.bar {
  border: var(--u-border);
}
</style>
